import MongoObject from "./MongoObject.interface.ts";
import { Collection, ObjectId } from "../deps.ts";

abstract class BaseModel {
  public id: string = "";
  protected static collection: Collection<any>;
  abstract mongoCollection: Collection<any>;

  protected static prepare<T extends BaseModel>(data: T & MongoObject) {
    data.id = data._id.$oid;
    //@ts-ignore
    delete data._id;
    return data as T;
  }

  static getValidMongoIdOrFail(id: string) {
    if (id.length !== 24) {
      throw new Error("Invalid Mongo ID.");
    }
    const oid = ObjectId(id);
    return oid;
  }

  static async findById<T extends BaseModel>(
    id: string,
  ): Promise<T | null> {
    try {
      const _id = this.getValidMongoIdOrFail(id);
      const model = await this.collection.findOne({ _id });
      // await this.collection.deleteOne(filter);
      if (model) {
        model.id = model._id.$oid;
        delete model._id;
        return model as T;
      }
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async findOne<T extends BaseModel>(
    filter: Object,
  ): Promise<T | null> {
    try {
      const model = await this.collection.findOne(filter);
      // await this.collection.deleteOne(filter);
      if (model) {
        model.id = model._id.$oid;
        delete model._id;
        return model as T;
      }
      return null;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  public async save(): Promise<this> {
    //@ts-ignore
    delete this.id;
    const { mongoCollection, ...rest } = this;
    const { $oid } = await this.mongoCollection.insertOne(rest);
    this.id = $oid;
    return this;
  }

  public async delete() {
    try {
      const _id = BaseModel.getValidMongoIdOrFail(this.id);
      return await this.mongoCollection.deleteOne({
        _id,
      });
    } catch (error) {
      console.error(error);
      return -1;
    }
  }

  static async findAll<T extends BaseModel>() {
    const model = await this.collection.find({}) as Array<
      T & MongoObject
    >;
    if (Array.isArray(model)) {
      if (model.length > 0) {
        return model.map(this.prepare).map((u) => {
          //IF THE USER MODEL DELETE THE USER'S PASSWORD
          //@ts-ignore
          if (u["password"]) {
            //@ts-ignore
            delete u["password"];
          }
          return u;
        });
      }
      return model as T[];
    }
    return [] as T[];
  }
}
export default BaseModel;
