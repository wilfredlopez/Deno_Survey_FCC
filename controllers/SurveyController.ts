import {
  RouterContext,
} from "../deps.ts";
import Survey from "../models/Survey.ts";
import BaseSurveyController from "./BaseSurveyController.ts";
import User from "../models/User.ts";

class SurveyController extends BaseSurveyController {
  // async test(context: RouterContext) {
  //   const surveys = await Survey.findAll();
  //   context.response.body = surveys;
  // }
  async getUserSurveys(context: RouterContext) {
    try {
      const user = context.state.user as User;
      const surveys = await Survey.findByUser(user.id);
      context.response.body = surveys;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }
  async getOne(context: RouterContext) {
    const { id } = context.params;
    if (!id) {
      context.response.status = 400;
      context.response.body = {
        message: "id is required",
      };
      return;
    }
    try {
      const survey = await this.findSurveyOrFail(context, id);

      if (survey) {
        const { mongoCollection, ...rest } = survey;
        context.response.body = rest;
      }
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }

  async create(context: RouterContext) {
    try {
      const { value: {name, description} } = await context.request.body();

      const user = context.state.user as User;

      const survey = new Survey({
        description,
        name,
        userId: user.id,
      });
      await survey.save();

      const { mongoCollection, ...rest } = survey;
      context.response.status = 201;
      context.response.body = {
        message: rest,
      };
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }

  async update(context: RouterContext) {
    try {
      const { id } = context.params;
      const { value: {name, description} } = await context.request.body();

      const survey = await this.findSurveyOrFail(context, id);

      if (!survey) {
        this.sendNotFoundResponse(context);
        return;
      }
      await survey.update({ name, description });
      const { mongoCollection, ...rest } = survey;
      context.response.body = rest;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }

  async delete(context: RouterContext) {
    const { id } = context.params;

    const survey = await this.findSurveyOrFail(context, id);

    if (!survey) {
      return;
    }
    try {
      await survey.delete();
      const { mongoCollection, ...rest } = survey;
      context.response.status = 204;
      context.response.body = rest;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }
}

const surveyController = new SurveyController();

export default surveyController;
