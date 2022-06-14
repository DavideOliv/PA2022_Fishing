import mongoose,{ Types } from "mongoose";
import { IMongoEntity } from "./mongo-entity";
import { Status } from "@shared/enums";

/**
 * Job model
 * @param {ObjectId} user_id - user id in MongoDB that submitted the job
 * @param {Status} status - job status
 * @param {Date} start - job start processing date
 * @param {Date} end - job end processing date
 * @param {Date} submit - job submit date
 * @param {number} price - job price in tokens
 * @param {any} job_info - job data info
*/
export interface IJob {
    //_id: Types.ObjectId;
    user_id: Types.ObjectId;
    status: Status;
    submit: Date;
    start: Date;
    end: Date;
    price: number;
    job_info: any;
}

/**
 * Job model mongoose schema
*/
export const jobSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    submit: {
        type: Date,
        default: Date.now
    },
    start: {
        type: Date,
    },
    end: {
        type: Date,
    },
    price: {
        type: Number,
        required: true,
    },
    job_info: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    }
});

export const Job = mongoose.model<IJob & IMongoEntity>('Job', jobSchema);