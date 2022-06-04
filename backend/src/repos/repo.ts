import { Model, Types } from 'mongoose';
import {IMongoEntity} from '@models/mongo-entity';
/**
 * Interface Repository
 * * T = Interface of the entity
 * 
 */


export interface IRepository<T> {

    getOne(id: Types.ObjectId): Promise<T | null>;
    persists(id: Types.ObjectId): Promise<boolean>;
    getAll(): Promise<T[]>;
    add(item: T): Promise<T>;
    update(item: T): Promise<T>;
    delete(id: Types.ObjectId): Promise<T | null>;
    getFiltered(filter: any): Promise<T[]>;
}

export class MongoRepository<T extends IMongoEntity> implements IRepository<T>{
    private model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    getOne(id: Types.ObjectId): Promise<T | null> {
        return this.model.findById(id).exec();
    }

    persists(id: Types.ObjectId): Promise<boolean> {
        return this.model.exists({ _id: id }).exec().then(exists => exists != null);
    }

    getAll(): Promise<T[]> {
        return this.model.find().exec();
    }

    add(item: T): Promise<T> {
        return new this.model(item).save();
    }

    update(item: T): Promise<T> {
        return this.model.findByIdAndUpdate(item._id, item, { new: true }).exec();
    }

    delete(id: Types.ObjectId): Promise<T | null> {
        return this.model.findByIdAndDelete(id).exec();
    }

    getFiltered(filter: any): Promise<T[]> {
        return this.model.find(filter).exec();
    }

}