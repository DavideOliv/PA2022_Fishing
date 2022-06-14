import Bull, { Queue } from 'bull';
import { IJob } from '@models/job-model';
import { IProcessor } from './processor';

/**
 * Event listener for bull queue (redis).
 * check https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#events for more info
 * 
 * @method onError - bull 'error' event handler.
 * @method onPending - bull 'waiting' event handler.
 * @method onRunning - bull 'active' event handler.
 * @method onCompleted - bull 'completed' event handler.
 * @method onFailed - bull 'failed' event handler.
 */
export interface IJobEventsListener {
    onError(error: Error): void
    onPending(jobId: string): void;
    onRunning(job: Bull.Job): void;
    onComplete(job: Bull.Job, result: any): void;
    onFailed(job: Bull.Job, err: Error): void;
}

/**
 * Dispatcher Interface.
 * Dispatcher is responsible for managing the queue and the processors.
 */
export interface IDispatcher {
    addJob(job: IJob, id?: string): Promise<String>;
    setJobEventsListener(jobEventsListener: IJobEventsListener): void;
}

/**
 * Dispatcher implementation.
 * Dispatcher is responsible for managing the queue and the processors using the job event listener
 * @implements {IDispatcher}
 * 
 * @param {Bull.Queue<IJob>} queue - bull job queue.
 * @param {IJobEventsListener} jobEventsListener - job event listener. It is used to set the dispatcher events callbacks.
 * @param {IProcessor} processor - object able to process IJob data.
 * 
 * @method addJob - add a job to the queue.
 * @method setJobEventsListener - set the job event listener.
 */
export class Dispatcher implements IDispatcher {
    private queue: Queue<IJob>;
    private jobEventsListener?: IJobEventsListener;
    private processor : IProcessor;
    
    /**
     * @constructor
     * Build a new dispatcher creating a new bull queue using redis server.
     * 
     * @param {IProcessor} processor - object able to process IJob data.
     */
    constructor(processor : IProcessor) {
        this.processor = processor;
        this.queue = new Bull('jobs', `${process.env.REDIS_URI}`);
        this.queue.process((job) => this.processor.process(job.data.job_info));
    }

    /**
     * Set the job event listener.
     * @param jobEventsListener - job event listener. It is used to set the dispatcher events callbacks.
     */
    setJobEventsListener(jobEventsListener: IJobEventsListener) {
        this.jobEventsListener = jobEventsListener;

        this.queue.on('error', (err) => jobEventsListener.onError(err));
        this.queue.on('waiting', (jobId) => jobEventsListener.onPending(jobId.toString()));
        this.queue.on('active', (job) => jobEventsListener.onRunning(job));
        this.queue.on('completed', (job, result) => jobEventsListener.onComplete(job, result));
        this.queue.on('failed', (job, err) => jobEventsListener.onFailed(job, err));
    }

    /**
     * 
     * @param {IJob} job - Job to add to the queue.
     * @param {String} id - Optional id for the given job. If not provided, a random one is generated.
     * @returns {Promise<String>} - Job id.
     */
    async addJob(job: IJob, id?:String): Promise<String> {
        return this.queue.add(job, { jobId: id ? `${id}` : undefined })
            .then((job: Bull.Job) => `${job.id}`);
    }
    
}