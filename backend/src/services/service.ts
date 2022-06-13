import { MongoRepository } from '@repos/repo';
import { IUser, User } from '@models/user-model';
import { IJob, Job } from '@models/job-model';
import { IJobEventsListener, IDispatcher, Dispatcher } from '@services/dispatcher';
import Bull from 'bull';
import logger from 'jet-logger';
import { Status } from '@shared/enums'
import { ISession } from '@models/session-model';
import { Types } from 'mongoose';
import { IMongoEntity } from '@models/mongo-entity';
import { SessionJobProcessor } from './processor';
import { Role } from '@shared/enums';

interface IStats {
    min: number;
    max: number;
    avg: number;
}

export class Service implements IJobEventsListener {
    private static _instance : Service;

    private jobRepo: MongoRepository<IJob>;
    private userRepo: MongoRepository<IUser>;
    private dispatcher: IDispatcher;
    private sessionJobProcessor : SessionJobProcessor;

    public static getInstance() : Service {
        if (!Service._instance) {
            Service._instance = new Service();
        }
        return Service._instance;
    }
    
    private constructor() {
        this.jobRepo = new MongoRepository<IJob>(Job);
        this.userRepo = new MongoRepository<IUser>(User);
        this.sessionJobProcessor = new SessionJobProcessor();
        this.dispatcher = new Dispatcher(this.sessionJobProcessor);
        this.dispatcher.setJobEventsListener(this);
    }  
    onError(error: Error): void {
        logger.err("onError: "+ error);
    }
    onPending(jobId: string): void {
        logger.info(`Job ${jobId} is pending`);
    }
    onRunning(job: Bull.Job<IJob & IMongoEntity>): void {
        logger.info(`Job ${job.id} is running`);
        const update_item = {
            status: Status.RUNNING,
            start: new Date()
        };
        this.jobRepo.update(new Types.ObjectId(job.id), update_item);
    }
    onComplete(job: Bull.Job<IJob & IMongoEntity>, result: any): void {
        logger.info(`Job ${job.id} is completed`);
        const newJobInfo = { ...job.data.job_info, pred_points: result};
        const update_item = {
            job_info: newJobInfo,
            status: Status.DONE,
            end: new Date()
        }
        this.jobRepo.update(new Types.ObjectId(job.id), update_item);
        this.chargeCredit(- job.data.price, job.data.user_id.toString());
    }
    
    onFailed(job: Bull.Job<IJob & IMongoEntity>, err: Error): void {
        logger.warn(`Job ${job.id} failed`);
        logger.warn(err);
        const update_item = {
            status: Status.FAILED,
            end: new Date()
        };
        this.jobRepo.update(new Types.ObjectId(job.id), update_item);
    }

    
    async newJobRequest(user_id : string , sess_data : ISession) : Promise<String> {
        const uid = new Types.ObjectId(user_id);
        const job = {
            status: Status.PENDING,
            price: this.sessionJobProcessor.calculatePrice(sess_data),
            job_info: sess_data,
            user_id: uid,
            submit: new Date(),
            start: new Date(),
            end: new Date()
        };

        //logger.info(`New job request: ${JSON.stringify(job)}`);
    
        return this.userRepo.getOne(uid)
            .then(user => { if (user.credit < job.price) throw new Error('Not enough credit') })
            .then(() => this.jobRepo.add(job))
            .then(job => this.dispatcher.addJob(job, job._id.toString()))
            .catch(err => err.toString());
    }

    async getJobStatus(job_id : string) : Promise<any> {
        return this.jobRepo.getOne(new Types.ObjectId(job_id))
            .then(job => ({id: job_id, status: job.status}))
            .catch(err => err.toString());
    }

    async getJobInfo(job_id : string) : Promise<any> {
        return this.jobRepo.getOne(new Types.ObjectId(job_id))
            .then(job => job.status == Status.DONE ? job.job_info : {error: 'Job not completed'})
            .catch(err => err.toString());
    }

    async getUserCredit(user_id : string) : Promise<any> {
        return this.userRepo.getOne(new Types.ObjectId(user_id))
            .then(user => ({username: user.username, email: user.email, credit: user.credit}))
            .catch(err => err.toString());
    }

    
    async getStatistics(user_id: string) : Promise<IStats> {
        return this.jobRepo.getFiltered({user_id: new Types.ObjectId(user_id)})
            .then(jobs => jobs
                .filter(job => job.status == Status.DONE && job.end!=undefined && job.start!=undefined)
                .map(job => job.end.valueOf() - job.start.valueOf())
                .reduce((acc, t : number) => {
                    if (t < acc.min) acc.min = t;
                    if (t > acc.max) acc.max = t;
                    acc.sum += t;
                    acc.cnt++;
                    return acc;
                }, {min: Number.MAX_VALUE, max: 0, sum: 0, cnt: 0})
            )
            .then(stats => ({min: stats.min, max: stats.max, avg: stats.sum / stats.cnt}));
    }

    async chargeCredit(amount: number, user_id: string): Promise<any> {
        return this.userRepo.getOne(new Types.ObjectId(user_id))
            .then(user => this.userRepo.update(user._id, {credit: user.credit + amount}))
            .then(user => ({ username: user.username, email: user.email, credit: user.credit }))
            .catch(err => err.toString());
    }

    async authenticate(decoded_user: any): Promise<string> {
        logger.info(`Authenticating user ${JSON.stringify(decoded_user)}`);
        return this.userRepo.getFiltered(decoded_user)
            .then(users =>{
                logger.info("Found users: " + JSON.stringify(users));
                if (users.length == 1) return users[0]._id.toString();
                else throw new Error('User not found');
            });
    }

    async checkAdmin(user_id : string): Promise<boolean> {
        return this.userRepo.getOne(new Types.ObjectId(user_id))
            .then(user => {console.log(JSON.stringify(user)); return user.role == Role.ADMIN});
    }
} 