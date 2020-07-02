import { surveyCollection } from "../mongo.ts";
import MongoObject from "./MongoObject.interface.ts";
import BaseModel from "./BaseModel.ts";
interface SurveyProps {
  name: string;
  description: string;
  userId: string;
}

export default class Survey extends BaseModel {
  public name: string;
  public description: string;
  public userId: string;
  static collection = surveyCollection;
  mongoCollection = surveyCollection;
  //   public id: string = "";
  constructor(
    { description, name, userId }: SurveyProps,
  ) {
    super();
    this.name = name;
    this.description = description;
    this.userId = userId;
  }

  public async update(
    data: { name?: string; description?: string },
  ): Promise<Survey> {
    try {
      const id = Survey.getValidMongoIdOrFail(this.id);

      await this.mongoCollection.updateOne(
        // { _id: { $oid: this.id } },
        { _id: id },
        { $set: data },
      );

      if (data.description) {
        this.description = data.description;
      }
      if (data.name) {
        this.name = data.name;
      }
    } catch (error) {
      console.error(error);
    } finally {
      return this;
    }
  }

  static async findByUser(userId: string) {
    try {
      this.getValidMongoIdOrFail(userId);
      const surveys = await surveyCollection.find({ userId }) as Array<
        Survey & MongoObject
      >;
      if (Array.isArray(surveys)) {
        if (surveys.length > 0) {
          return surveys.map(Survey.prepare);
        }
        return surveys as Survey[];
      }
      return [] as Survey[];
    } catch (error) {
      return [] as Survey[];
    }
  }
}
