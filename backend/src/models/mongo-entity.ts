import {Types} from 'mongoose';

export interface IMongoEntity {
    readonly _id: Types.ObjectId;
}