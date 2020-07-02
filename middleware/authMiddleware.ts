import { RouterContext, validateJwt } from "../deps.ts";
import { JWT_SECRET } from "../constants.ts";
import User from "../models/User.ts";

export const authMiddleware = async (ctx: RouterContext, next: Function) => {
  const authHeader = ctx.request.headers.get("Authorization");

  if (!authHeader) {
    ctx.response.status = 401;
    ctx.response.body = {
      message: "Unauthorized.",
    };
    return;
  }
  const jwt = authHeader.split(" ")[1];
  if (!jwt) {
    ctx.response.status = 401;
    ctx.response.body = {
      message: "Unauthorized.",
    };
    return;
  }

  const data = await validateJwt(jwt, JWT_SECRET, { isThrowing: false });

  if (!data || !data.payload) {
    ctx.response.status = 401;
    ctx.response.body = {
      message: "Unauthorized.",
    };
    return;
  }
  const email = data.payload.iss;
  const user = await User.findOne<User>({ email });
  if (!user) {
    ctx.response.status = 404;
    ctx.response.body = {
      message: "User Not Found.",
    };
    return;
  }
  ctx.state.user = user;
  return next();
};
