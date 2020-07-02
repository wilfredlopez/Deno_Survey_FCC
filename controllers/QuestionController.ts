import {
  RouterContext,
} from "../deps.ts";
// import User from "../models/User.ts";
import BaseController from "./BaseController.ts";
import Question, { QuestionType } from "../models/Question.ts";
import Survey from "../models/Survey.ts";

class QuestionController extends BaseController {
  async test(context: RouterContext) {
    try {
      const questions = await Question.findAll<Question>();
      context.response.body = questions;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }
  async getBySurvey(context: RouterContext) {
    try {
      const surveyId = context.params.surveyId;
      if (!surveyId) {
        this.sendErrorResponse(context, {
          message: "Survey Id is required.",
          statusCode: 400,
        });
        return;
      }
      let survey = await Survey.findById<Survey>(surveyId);
      if (!survey) {
        this.sendErrorResponse(context, {
          message: "Survey Not Found.",
          statusCode: 404,
        });
        return;
      }

      const questions = await Question.findBySurveyId(surveyId);
      context.response.body = questions;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }
  async getOne(context: RouterContext) {
    try {
      const id = context.params.id;
      if (!id) {
        this.sendNotFoundResponse(context);
        return;
      }
      const question = await Question.findById<Question>(id);

      if (!question) {
        this.sendNotFoundResponse(context);
        return;
      }

      context.response.body = question;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }
  async create(context: RouterContext) {
    try {
      const { value: {text, type, required, data} } = await context.request
        .body();

      const isValidType = Question.isValidQuestionType(type);

      if (!isValidType) {
        this.sendErrorResponse(context, {
          message:
            `Question type most be of type QuestionType: ${QuestionType.choice} or ${QuestionType.text}`,
          statusCode: 400,
        });
        return;
      }

      const areValidatedFields = Question.validateRequiredFields(
        { text, type, required, data },
      );

      if (!areValidatedFields[0]) {
        context.response.status = 400;
        context.response.body = {
          error: "Required field is missing.",
          field: areValidatedFields[1],
        };
        return;
      }

      //   const user = context.state.user as User;
      const surveyId = context.params.surveyId;
      if (!surveyId) {
        this.sendErrorResponse(context, {
          message: "Survey Id is required.",
          statusCode: 400,
        });
        return;
      }
      const survey = await Survey.findById<Survey>(surveyId);
      if (!survey) {
        this.sendNotFoundResponse(context, "Survey Not Found.");
        return;
      }
      const question = new Question({
        data,
        required: Boolean(required),
        text: text,
        type,
        //   userId: user.id,
        surveyId,
      });
      await question.save();

      const { mongoCollection, ...rest } = question;
      context.response.status = 201;
      context.response.body = rest;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }

  async update(context: RouterContext) {
    try {
      const { id } = context.params;
      let { value: {text, type, required, data} } = await context.request
        .body();

      if (!id) {
        this.sendErrorResponse(context, {
          message: "Id most be provided",
          statusCode: 400,
        });
        return;
      }
      if (required) {
        required = Boolean(required);
      }

      if (type) {
        const isvalid = Question.isValidQuestionType(type);

        if (!isvalid) {
          this.sendErrorResponse(context, {
            message:
              `Question type most be of type QuestionType: ${QuestionType.choice} or ${QuestionType.text}`,
            statusCode: 400,
          });
          return;
        }
      }
      const question = await this.findQuestionOrFail(context, id);
      if (!question) {
        return;
      }
      await question.update({ text, type, required, data });
      const { mongoCollection, ...rest } = question;
      context.response.body = rest;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }

  private async findQuestionOrFail(context: RouterContext, id: string) {
    let question = await Question.findById<Question>(id);

    if (!question) {
      this.sendNotFoundResponse(context);
      return null;
    }
    question = new Question(question);
    question.id = id;
    return question;
  }

  async delete(context: RouterContext) {
    const { id } = context.params;

    if (!id) {
      this.sendErrorResponse(context, {
        statusCode: 400,
        message: "Id most be provided.",
      });
      return;
    }

    const question = await this.findQuestionOrFail(context, id);
    if (!question) {
      return;
    }
    try {
      await question.delete();
      const { mongoCollection, ...rest } = question;
      context.response.status = 204;
      context.response.body = rest;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }
}

const questionController = new QuestionController();

export default questionController;
