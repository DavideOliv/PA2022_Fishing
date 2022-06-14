import { MongoRepository } from '@repos/repo';
import { IUser, User } from '@models/user-model';
import { IJob, Job } from '@models/job-model';
import { IJobEventsListener, IDispatcher, Dispatcher } from '@services/dispatcher';
import Bull from 'bull';
import logger from 'jet-logger';
import { Status } from '@shared/enums'
import { ISession } from '@models/session-model';
import mongoose, { Types } from 'mongoose';
import { IMongoEntity } from '@models/mongo-entity';
import { SessionJobProcessor } from './processor';
import { Role } from '@shared/enums';


/**
 * @interface IStats
 * @description Interface for jobs statistics.
 * 
 * @param {number} min - minimum time.
 * @param {number} max - maximum time.
 * @param {number} avg - average time.
 */
export interface IStats {
    min: number;
    max: number;
    avg: number;
}

/**
 * @class Service
 * @description Service singleton implementation for Session Jobs.
 * @implements {IJobEventsListener}
 * 
 * @param {MongoRepository<IJob>} jobRepository - jobs repository.
 * @param {MongoRepository<IUser>} userRepository - users repository.
 * @param {IDispatcher} dispatcher - dispatcher for the given jobs.
 * @param {SessionJobProcessor} processor - processor for the given jobs.
 * 
 * @method getInstance - get instance of the service.
 * @method newJobRequest - create new redis-bull job.
 * @method getJobStatus - get job status by id.
 * @method getStatistics - get job statistics.
 * @method getUserCredits - get user credit.
 * @method chargeCredit - charge user credit.
 * @method authenticate - find user by JWT decoded token.
 * @method checkAdmin - check if user has admin role.
 */
export class Service implements IJobEventsListener {
    private static _instance : Service;

    private jobRepo: MongoRepository<IJob>;
    private userRepo: MongoRepository<IUser>;
    private dispatcher: IDispatcher;
    private sessionJobProcessor : SessionJobProcessor;

    /**
     * Create or get the service instance.
     * @returns {Service} - service instance.
     */
    public static getInstance() : Service {
        if (!Service._instance) {
            Service._instance = new Service();
        }
        return Service._instance;
    }
    
    /**
     * @constructor
     * Set up the service instance building the dependencies.
     */
    private constructor() {
        this.jobRepo = new MongoRepository<IJob>(Job);
        this.userRepo = new MongoRepository<IUser>(User);
        this.sessionJobProcessor = new SessionJobProcessor();
        this.dispatcher = new Dispatcher(this.sessionJobProcessor);
        this.dispatcher.setJobEventsListener(this);
    }
    /**
     * Log the error raised by bull
     * @param error - error message.
     */
    onError(error: Error): void {
        logger.err("onError: "+ error);
    }

    /**
     * Log that the given job was correctly added to queue and now is pending
     * @param jobId - job id.
     */
    onPending(jobId: string): void {
        logger.info(`Job ${jobId} is pending`);
    }
    
    /**
     * Log that the given job is now in progress and update the job status in database.
     * @param job - running job info.
     */
    onRunning(job: Bull.Job<IJob & IMongoEntity>): void {
        logger.info(`Job ${job.id} is running`);
        const update_item = {
            status: Status.RUNNING,
            start: new Date()
        };
        this.jobRepo.update(new Types.ObjectId(job.id), update_item);
    }

    /**
     * Log that the given job is completed and update the status on database.
     * Finally make the payment to the user.
     * @param job - completed job.
     */
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
    
    /**
     * Log that the given job is failed and log the error.
     * Finally update job status on database.
     * @param job - failed job.
     * @param err - error message.
     */
    onFailed(job: Bull.Job<IJob & IMongoEntity>, err: Error): void {
        logger.warn(`Job ${job.id} failed`);
        logger.warn(err);
        const update_item = {
            status: Status.FAILED,
            end: new Date()
        };
        this.jobRepo.update(new Types.ObjectId(job.id), update_item);
    }

    /**
     * Add new job to queue and return the job id.
     * @param user_id - user id.
     * @param sess_data - session data.
     * @returns {Promise<String} - job id.
     */
    async newJobRequest(user_id : string , sess_data : ISession) : Promise<String> {
        const uid = new Types.ObjectId(user_id);
        const curr_timestamp = new Date();
        const job = {
            status: Status.PENDING,
            price: this.sessionJobProcessor.calculatePrice(sess_data),
            job_info: sess_data,
            user_id: uid,
            submit: curr_timestamp,
            start: curr_timestamp,
            end: curr_timestamp
        };

        logger.info(`New job request from user ${user_id}`);
    
        return this.userRepo.getOne(uid)
            .then(user => { if (user.credit < job.price) throw new Error('Not enough credit') })
            .then(() => this.jobRepo.add(job))
            .then(job => this.dispatcher.addJob(job, job._id.toString()));
            // .catch(err => err.toString());
    }

    /**
     * Get the status of the job with the given id.
     * @param job_id - job id.
     * @returns {Promise<any>} - job status.
     */
    async getJobStatus(job_id : string) : Promise<any> {
        return this.jobRepo.getOne(new Types.ObjectId(job_id))
            .then(job => ({id: job_id, status: job.status}))
            .catch(err => { throw new Error("Job not found") });
    }

    /**
     * Get job info if the job is completed.
     * @param job_id - job id.
     * @returns {Promise<any>} - job info if job is Done.
     */
    async getJobInfo(job_id : string) : Promise<any> {
        return this.jobRepo.getOne(new Types.ObjectId(job_id))
            .then(job => job.status == Status.DONE ? job.job_info : {error: 'Job not completed'})
            .catch(err => { throw new Error("Job not found") });
    }

    /**
     * Get the credit of user with the given id.
     * @param user_id - user id.
     * @returns {Promise<any>} - object with username, email and credit of the user.
     */
    async getUserCredit(user_id : string) : Promise<any> {
        return this.userRepo.getOne(new Types.ObjectId(user_id))
            .then(user => ({username: user.username, email: user.email, credit: user.credit}))
            .catch(err => { throw new Error("User not found") });
    }


    /**
     * Get Jobs statistics for the user with the given id.
     * @param user_id - user id.
     * @returns {Promise<IStats>} - stats of the jobs submitted by the given user.
     */
    async getStatistics(user_id: string, cb: (jobInstance: IJob) => number) : Promise<IStats> {
        return this.jobRepo.getFiltered({user_id: new Types.ObjectId(user_id)})
            .then(jobs => jobs
                .filter(job => job.status == Status.DONE)
                .map(job => cb(job))
                .reduce((acc, t : number) => {
                    if (t < acc.min) acc.min = t;
                    if (t > acc.max) acc.max = t;
                    acc.sum += t;
                    acc.cnt++;
                    return acc;
                }, {min: Number.MAX_VALUE, max: 0, sum: 0, cnt: 0})
            )
            .then(stats => ({min: stats.min, max: stats.max, avg: stats.sum / stats.cnt}));
            //.catch....
    }


    /**
     * Charge user credit.
     * @param amount - amount to charge.
     * @param user_id - user id to be charged.
     * @returns {Promise<any>} - object representing the user with new credit.
     */
    async chargeCredit(amount: number, user_email: string): Promise<any> {
        return this.userRepo.getFiltered({email: user_email})
            .then(users => users[0])
            .then(user => this.userRepo.update(user._id, {credit: user.credit + amount}))
            .then(user => ({ username: user.username, email: user.email, credit: user.credit }))
            .catch(err => { throw new Error("User not found") });
    }

    /**
     * Get user from db by the given decoded JWT token.
     * @param decoded_user - JWT decoded user object.
     * @returns {Promise<string>} - user id if exists.
     */
    async authenticate(decoded_user: any): Promise<string> {
        logger.info(`Authenticating user ${JSON.stringify(decoded_user)}`);
        return this.userRepo.getFiltered(decoded_user)
            .then(users =>{
                if (users.length == 1) return users[0]._id.toString();
                else throw new Error('User not found');
            });
    }

    /**
     * Check if the given user is admin.
     * @param user_id - user id.
     * @returns {Promise<boolean>} - true if user is admin.
     */
    async checkAdmin(user_id : string): Promise<boolean> {
        return this.userRepo.getOne(new Types.ObjectId(user_id))
            .then(user => user.role == Role.ADMIN);
    }
} 