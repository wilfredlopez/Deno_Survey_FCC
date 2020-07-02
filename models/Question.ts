import { questionsCollection } from "../mongo.ts";
import BaseModel from "./BaseModel.ts";
import MongoObject from "./MongoObject.interface.ts";

export enum QuestionType {
  "choice" = "choice",
  "text" = "text",
}

interface QuestionProps {
  surveyId: string;
  text: string;
  type: QuestionType;
  required: boolean;
  data: { [key: string]: any };
}

type ValidationProps = Omit<QuestionProps, "surveyId">;

export default class Question extends BaseModel {
  public surveyId: string;
  public text: string;
  public type: QuestionType;
  public required: boolean;
  public data: { [key: string]: any };
  protected static collection = questionsCollection;
  mongoCollection = questionsCollection;

  constructor(
    { data, required, surveyId, text, type }: QuestionProps,
  ) {
    super();
    this.data = data;
    this.required = required;
    this.surveyId = surveyId;
    this.text = text;
    this.type = type;
  }

  static validateRequiredFields(
    props: ValidationProps,
  ): [false, keyof ValidationProps] | [true] {
    const expectedKeys: Array<
      [keyof ValidationProps, (value: any) => boolean]
    > = [
      ["data", (value: any) => {
        return typeof value === "object";
      }],
      ["required", (value: any) => {
        return typeof value === "boolean";
      }],
      ["text", (value) => {
        return typeof value === "string";
      }],
      ["type", Question.isValidQuestionType],
    ];

    const propKeys = Object.keys(props);
    for (const key of expectedKeys) {
      if (!propKeys.includes(key[0])) {
        return [false, key[0]];
      }
      if (!key[1](props[key[0]])) {
        return [false, key[0]];
      }
    }

    // if (!this.isValidQuestionType(props.type)) {
    //   return [false, "type"];
    // }

    return [true];
  }

  static isValidQuestionType(choice: any) {
    return choice === QuestionType.choice || choice === QuestionType.text;
  }

  static async findBySurveyId(surveyId: string) {
    try {
      this.getValidMongoIdOrFail(surveyId);
      const questions = await Question.collection.find({ surveyId }) as Array<
        Question & MongoObject
      >;
      if (Array.isArray(questions)) {
        if (questions.length > 0) {
          return questions.map(Question.prepare).map((q) => {
            const id = q.id;
            q = new Question(q);
            q.id = id;
            return q;
          });
        }
        return questions as Question[];
      }

      return [] as Question[];
    } catch (error) {
      return [] as Question[];
    }
  }
  isMultipleChoise() {
    if (!this.data) {
      return false;
    }
    if (!this.data.multiple) {
      return false;
    }
    return this.data.multiple === true;
  }
  isText() {
    return this.type === QuestionType.text;
  }

  public async update(
    data: Partial<QuestionProps>,
  ): Promise<Question> {
    try {
      const id = Question.getValidMongoIdOrFail(this.id);

      await this.mongoCollection.updateOne(
        { _id: id },
        { $set: data },
      );
      for (let key in data) {
        // const dk = key as keyof QuestionProps & keyof Question;
        if (data[key as keyof QuestionProps & keyof Question] !== undefined) {
          //@ts-ignore
          this[key] = data[key];
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      return this;
    }
  }
}
