import mongoose,{ Types } from "mongoose";
import { IMongoEntity } from "./mongo-entity";
import { Status } from "@shared/enums";


export interface IJobInfo {
    process(): void;
    calculatePrice(): number;
}


export interface IJob {
    //_id: Types.ObjectId;
    user_id?: Types.ObjectId;
    status?: Status;
    submit: Date;
    start: Date;
    end: Date;
    price?: number;
    job_info: IJobInfo;
}


export const jobSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    status: {
        type: Number,
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