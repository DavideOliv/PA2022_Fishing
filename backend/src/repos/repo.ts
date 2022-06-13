import mongoose, { Model, Types } from 'mongoose';
import {IMongoEntity} from '@models/mongo-entity';
/**
 * Repository interface
 * @typeparam T - type of model
 * @method getAll - get all documents of model
 * @method getOne - get one document of model with the given id
 * @method add - create new document of model
 * @method update - update document of model with the given id and the given item
 * @method delete - delete document of model with the given id
 * @method getFiltered - get all documents of model with the given filter
 * @method persists - check if an object with the given id exists in database
 */
export interface IRepository<T> {

    getOne(id: Types.ObjectId): Promise<T>;
    persists(id: Types.ObjectId): Promise<boolean>;
    getAll(): Promise<T[]>;
    add(item: T): Promise<T>;
    update(id: Types.ObjectId, item:any): Promise<T>;
    delete(id: Types.ObjectId): Promise<T>;
    getFiltered(filter: any): Promise<T[]>;
}

/**
 * Repository implementation for MongoDB models
 * @typeparam T - type of model
 * @implements {IRepository<T>}
 * @constructor - create new repository for the given model
 */
export class MongoRepository<T> implements IRepository<T>{
    private model: Model<T & IMongoEntity>;

    /**
     * @param {mongoose.Model} model - mongoose DAO for the given type T
     */
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

    async update(id: Types.ObjectId, item:any): Promise<T & IMongoEntity> {
        return this.model.findByIdAndUpdate(id, item, { new: true }).exec()
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