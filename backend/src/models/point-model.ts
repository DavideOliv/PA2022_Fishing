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
    speed: number;
    timestamp: Date;
}

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