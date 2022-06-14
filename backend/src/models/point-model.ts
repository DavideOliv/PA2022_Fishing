import mongoose from "mongoose";

/**
 * Geographical point interface
 * @param {number} point_id - point id in session
 * @param {number} lat - latitude
 * @param {number} long - longitude
 * @param {number} speed - speed in meters per second
 * @param {Date} timestamp - point timestamp
*/
export interface IPoint {
    point_id: number;
    lat: number;
    long: number;
    speed?: number;
    timestamp: Date;
}

/**
 * Typeguard
 * Validate if an object is a valid point
 */
export function isIPoint(obj: any): boolean {
    return obj
        && obj.hasOwnProperty("point_id") && typeof obj["point_id"] === "number"
        && obj.hasOwnProperty("lat") && typeof obj["lat"] === "number"
        && obj.hasOwnProperty("long") && typeof obj["long"] === "number"
        && obj.hasOwnProperty("timestamp") && !isNaN(Date.parse(obj["timestamp"]));
}

/**
 * Mongoose Point schema
 */

export const pointSchema = new mongoose.Schema({
    point_id: {
        type: Number,
        required: true,
    },
    lat: {
        type: Number,
        required: true,
    },
    long: {
        type: Number,
        required: true,
    },
    speed: {
        type: Number,
    },
    timestamp: {
        type: Date,
        required: true,
    }
});