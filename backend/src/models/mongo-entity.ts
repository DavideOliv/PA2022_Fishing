import {Types} from 'mongoose';

/**
 * MongoDB interface
 * @param {ObjectId} _id - mongoDB id
*/
export interface IMongoEntity {
    readonly _id: Types.ObjectId;
}