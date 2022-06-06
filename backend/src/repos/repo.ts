import { Model, Types } from 'mongoose';
import {IMongoEntity} from '@models/mongo-entity';
/**
 * Interface Repository
 * * T = Interface of the entity
 * 
 */


export interface IRepository<T> {

    getOne(id: Types.ObjectId): Promise<T>;
    persists(id: Types.ObjectId): Promise<boolean>;
    getAll(): Promise<T[]>;
    add(item: T): Promise<T>;
    update(item: T): Promise<T>;
    delete(id: Types.ObjectId): Promise<T>;
    getFiltered(filter: any): Promise<T[]>;
}

export class MongoRepository<T> implements IRepository<T>{
    private model: Model<T & IMongoEntity>;

    constructor(model: Model<T & IMongoEntity>) {
        this.model = model;
    }

    async getOne(id: Types.ObjectId): Promise<T & IMongoEntity> {
        return this.model.findById(id).exec()
            .then(item => item ? item : Promise.reject(new Error(`${typeof this.model} not found`)));
    }

    async persists(id: Types.ObjectId): Promise<boolean> {
        return this.model.exists({ _id: id }).exec().then(exists => exists != null);
    }

    async getAll(): Promise<(T & IMongoEntity)[]> {
        return this.model.find().exec();
    }

    async add(item: T): Promise<T & IMongoEntity> {
        return new this.model(item).save();
    }

    async update(item: T & IMongoEntity): Promise<T & IMongoEntity> {
        return this.model.findByIdAndUpdate(item._id, item, { new: true }).exec()
            .then(item => item ? item : Promise.reject(new Error(`${typeof this.model} not found`)));;
    }

    async delete(id: Types.ObjectId): Promise<T & IMongoEntity> {
        return this.model.findByIdAndDelete(id).exec()
            .then(item => item ? item : Promise.reject(new Error(`${typeof this.model} not found`)));;
    }

    async getFiltered(filter: any): Promise<(T & IMongoEntity)[]> {
        return this.model.find(filter).exec();
    }

}