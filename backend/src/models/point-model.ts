import mongoose from "mongoose";

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