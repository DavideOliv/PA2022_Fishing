import Bull, { Queue } from 'bull';
import { IJob } from '@models/job-model';
import { Service } from "@services/service";


export interface IJobEventsListener {
    onError(error: Error): void
    onPending(jobId: string): void;
    onRunning(job: Bull.Job): void;
    onComplete(job: Bull.Job): void;
    onFailed(job: Bull.Job, err: Error): void;
}


export interface IDispatcher {
    addJob(job: IJob, id?: string): Promise<String>;
    setJobEventsListener(jobEventsListener: IJobEventsListener): void;
}

export class Dispatcher implements IDispatcher {
    private queue: Queue<IJob>;
    private jobEventsListener?: IJobEventsListener;
    
    constructor() {
        this.queue = new Bull('jobs', `${process.env.REDIS_URI}`);
        this.queue.process((job) => job.data.job_info.process());
    }

    setJobEventsListener(jobEventsListener: IJobEventsListener) {
        this.jobEventsListener = jobEventsListener;

        this.queue.on('error', jobEventsListener.onError);
        this.queue.on('waiting', jobEventsListener.onPending);
        this.queue.on('active', jobEventsListener.onRunning);
        this.queue.on('completed', jobEventsListener.onComplete);
        this.queue.on('failed', jobEventsListener.onFailed);
    }


    async addJob(job: IJob, id?:String): Promise<String> {
        return this.queue.add(job, { jobId: id ? `${id}` : undefined })
            .then((job: Bull.Job) => `${job.id}`);
    }
    
}