import { Model, Types } from 'mongoose';
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
 * @typeparam T - interface corresponding to the model
 * @implements {IRepository<T>}
 * @constructor - create new repository for the given model
 * @method parseId - parse id from the given string
 */
export class MongoRepository<T> implements IRepository<T>{
    private model: Model<T & IMongoEntity>;

    /**
     * @param {mongoose.Model} model - mongoose DAO for the given type T
     */
    constructor(model: Model<T & IMongoEntity>) {
        this.model = model;
    }

    /**
     * @param {string} id - id of the document to parse
     * @returns {Promise<Types.ObjectId>} - promise of parsed id
     * @throws {Error} - if id is not parsable as ObjectId
     */
    async parseId(id: string): Promise<Types.ObjectId> {
        return Promise.resolve(new Types.ObjectId(id));
    }

    /**
     * @param {Types.ObjectId} id - id of the document to get
     * @returns {Promise<T>} - promise with the document or rejected promise with error
     */
    async getOne(id: Types.ObjectId): Promise<T & IMongoEntity> {
        return this.model.findById(id).exec()
            .then(item => item ? item : Promise.reject(new Error(`${typeof this.model} not found`)));
    }

    /**
     * @param {Types.ObjectId} id - id of the document to check
     * @returns {Promise<boolean>} - promise with true if the document exists or false otherwise
     */
    async persists(id: Types.ObjectId): Promise<boolean> {
        return this.model.exists({ _id: id }).exec().then(exists => exists != null);
    }

    /**
     * @returns {Promise<T[]>} - promise with all documents of the model
     */
    async getAll(): Promise<(T & IMongoEntity)[]> {
        return this.model.find().exec();
    }

    /**
     * @param {T} item - item to add
     * @returns {Promise<T>} - promise with the added item
     */
    async add(item: T): Promise<T & IMongoEntity> {
        return new this.model(item).save();
    }

    /**
     * @param {Types.ObjectId} id - id of the document to update
     * @param {T} item - object with the new values
     * @returns {Promise<T>} - promise with the updated item or rejected promise with error
     */ 
    async update(id: Types.ObjectId, item:any): Promise<T & IMongoEntity> {
        return this.model.findByIdAndUpdate(id, item, { new: true }).exec()
            .then(item => item ? item : Promise.reject(new Error(`${typeof this.model} not found`)));;
    }

    /**
     * @param {Types.ObjectId} id - id of the document to delete
     * @returns {Promise<T>} - promise with the deleted item or rejected promise with error
     */ 
    async delete(id: Types.ObjectId): Promise<T & IMongoEntity> {
        return this.model.findByIdAndDelete(id).exec()
            .then(item => item ? item : Promise.reject(new Error(`${typeof this.model} not found`)));;
    }

    /**
     * @param {any} filter - filter to apply (object with fields to match)
     * @returns {Promise<T[]>} - promise with list of the filtered documents
     */
    async getFiltered(filter: any): Promise<(T & IMongoEntity)[]> {
        return this.model.find(filter).exec();
    }

}