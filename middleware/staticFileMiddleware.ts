import { send, Context } from "../deps.ts";
import { fileExist } from "../helpers.ts";

const BASE_PATH = `${Deno.cwd()}/public`;

const staticFileMiddleware = async (context: Context, next: Function) => {
  const path = `${BASE_PATH}${context.request.url.pathname}`;
  if (await fileExist(path)) {
    await send(context, context.request.url.pathname, {
      root: BASE_PATH,
    });
  } else {
    await next();
  }
};

export default staticFileMiddleware;
