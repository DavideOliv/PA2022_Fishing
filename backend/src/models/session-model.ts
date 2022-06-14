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
 * Typeguard
 * Validate if an object is a valid session
 */
export function isISession(obj: any): boolean {
    return obj
        && obj.hasOwnProperty("session_id") && typeof obj["session_id"] === "string"
        && obj.hasOwnProperty("vessel_id") && typeof obj["vessel_id"] === "string"
        && obj.hasOwnProperty("n_pred") && typeof obj["n_pred"] === "number" && obj["n_pred"] > 0
        && obj.hasOwnProperty("given_points") && Array.isArray(obj["given_points"]) && obj["given_points"].length > 0;
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