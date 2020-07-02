import {
  RouterContext,
} from "../deps.ts";

abstract class BaseController {
  protected sendErrorResponse(
    context: RouterContext,
    data: { message: string; statusCode: number } = {
      message: "Internal server error",
      statusCode: 500,
    },
  ) {
    context.response.status = data.statusCode;
    context.response.body = {
      message: data.message,
    };
  }
  sendNotFoundResponse(context: RouterContext, message = "Not Found.") {
    this.sendErrorResponse(context, {
      message: message,
      statusCode: 404,
    });
  }
}
export default BaseController;
