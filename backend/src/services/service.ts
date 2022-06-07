import { MongoRepository } from '@repos/repo';
import { IUser, User } from '@models/user-model';
import { IJob, Job } from '@models/job-model';
import { IJobEventsListener, IDispatcher, Dispatcher } from '@services/dispatcher';
import Bull from 'bull';
import logger from 'jet-logger';
import { Status } from '@shared/enums'
import { ISession } from '@models/session-model';
import { SessionJobInfo } from '@models/session-job';
import { Types } from 'mongoose';
import { IMongoEntity } from '@models/mongo-entity';

interface IStats {
    min: number;
    max: number;
    avg: number;
}

export class Service implements IJobEventsListener {
    private jobRepo: MongoRepository<IJob<SessionJobInfo>>;
    private userRepo: MongoRepository<IUser>;
    private dispatcher: IDispatcher<SessionJobInfo>;
    
    constructor() {
        this.jobRepo = new MongoRepository<IJob<SessionJobInfo>>(Job);
        this.userRepo = new MongoRepository<IUser>(User);
        this.dispatcher = new Dispatcher();
        this.dispatcher.setJobEventsListener(this);
    }  
    onError(error: Error): void {
        logger.err("onError: "+ error);
    }
    onPending(jobId: string): void {
        logger.info(`Job ${jobId} is pending`);
    }
    onRunning(job: Bull.Job<IJob<SessionJobInfo> & IMongoEntity>): void {
        logger.info(`Job ${job.id} is running`);
        job.data.job_info.process().then(() => console.log('3'));
        job.data.status = Status.RUNNING;
        job.data.start = new Date();
        this.jobRepo.update({
            ...job.data,
            _id: new Types.ObjectId(`${job.id}`)
        });
    }
    onComplete(job: Bull.Job<IJob<SessionJobInfo> & IMongoEntity>): void {
        logger.info(`Job ${job.id} is completed`);
        job.data.status = Status.DONE;
        job.data.end = new Date();
        this.jobRepo.update({
            ...job.data,
            _id: new Types.ObjectId(`${job.id}`)
        });
    }
    onFailed(job: Bull.Job<IJob<SessionJobInfo> & IMongoEntity>, err: Error): void {
        logger.warn(`Job ${job.id} failed`);
        logger.warn(err);
        job.data.status = Status.FAILED;
        this.jobRepo.update({
            ...job.data,
            _id: new Types.ObjectId(`${job.id}`)
        });
    }

    
    async newJobRequest(user_id : Types.ObjectId, sess_data : ISession) : Promise<String> {
        const job_info = new SessionJobInfo(sess_data);
        const job = {
            status: Status.PENDING,
            price: job_info.calculatePrice(),
            job_info: job_info,
            user_id: user_id,
            submit: new Date(),
            start: new Date(),
            end: new Date()
        };

        //logger.info(`New job request: ${JSON.stringify(job)}`);
    
        return this.userRepo.getOne(user_id)
            .then(user => { if (user.credit < job.price) throw new Error('Not enough credit') })
            .then(() => this.jobRepo.add(job))
            .then(mongoJob => this.dispatcher.addJob(job, mongoJob._id.toString()))
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
            .then(user => this.userRepo.update({...user, credit: user.credit + amount}))
    }
} 