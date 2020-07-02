import Survey from "../models/Survey.ts";
import {
  RouterContext,
} from "../deps.ts";
import User from "../models/User.ts";
import BaseController from "./BaseController.ts";

export default class BaseSurveyController extends BaseController {
  protected async findSurveyOrFail(context: RouterContext, id?: string) {
    if (!id) {
      context.response.status = 400;
      context.response.body = {
        message: "id is required",
      };
      return null;
    }
    try {
      const _id = Survey.getValidMongoIdOrFail(id);
      let survey = await Survey.findOne<Survey>({
        _id,
      });

      const user = context.state.user as User;

      if (!survey) {
        context.response.status = 404;
        context.response.body = {
          message: "Not Found.",
        };
        return null;
      }
      if (survey.userId !== user.id) {
        context.response.status = 403;
        context.response.body = {
          message: "You are not Authorized for this survey.",
        };
        return null;
      }

      survey = new Survey(survey);
      survey.id = id;
      return survey;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
