import mongoose from "mongoose";
import { IPoint, pointSchema } from "./point-model";

/**
 * Session interface
 * @param {string} session_id - session id
 * @param {string} vessel_id - AIS vessel id
 * @param {number} n_pred - number of forecast points
 * @param {IPoint[]} given_points - given points array
 * @param {IPoint[]} pred_points - predicted points array
 */
export interface ISession {
    session_id: string;
    vessel_id: string;
    n_pred: number;
    given_points: IPoint[];
    pred_points?: IPoint[];
}

/**
 * Mongoose Session schema
 */ 
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