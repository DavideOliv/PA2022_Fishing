import mongoose from "mongoose";
import { IPoint, pointSchema } from "./point-model";

export interface ISession {
    session_id: string;
    vessel_id: string;
    n_pred: number;
    given_points: IPoint[];
    pred_points?: IPoint[];
}


export const sessionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true,
    },
    vessel_id: {
        type: String,
        required: true,
    },
    n_pred: {
        type: Number,
        required: true,
    },
    given_points: {
        type: [pointSchema],
        required: true,
    },
    pred_points: {
        type: [pointSchema],
    }
});