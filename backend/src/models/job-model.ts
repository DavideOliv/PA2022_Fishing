import mongoose,{ Types } from "mongoose";
import { IPoint } from "./point-model";
import { ISession } from "./session-model";
import { IMongoEntity } from "./mongo-entity";


export interface IJobInfo {
    process(): void;
    calculatePrice(): number;
}

export class SessionJobInfo implements IJobInfo, ISession {
    session_id: string;
    vessel_id: string;
    n_pred: number;
    given_points: IPoint[];
    pred_points?: IPoint[] | undefined;

    constructor(session: ISession) {
        this.session_id = session.session_id;
        this.vessel_id = session.vessel_id;
        this.n_pred = session.n_pred;
        this.given_points = session.given_points;
        this.pred_points = session.pred_points;
    }

    process() {
        // TODO: process session
    }
    calculatePrice() : number {
        return (this.n_pred > 100) ? (this.n_pred - 100) * 0.006 + 0.5 : this.n_pred*0.005;
    }
}


export interface IJob extends IMongoEntity {
    //_id: Types.ObjectId;
    user_id: Types.ObjectId;
    status: string;
    submit: Date;
    start: Date;
    end: Date;
    price: number;
    job_info: IJobInfo;
}


export const jobSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    status: {
        type: Status,
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
        type: mongoose.Schema.Types.Subdocument,
        required: true,
    }
});

export const Job = mongoose.model<IJob>('Job', jobSchema);