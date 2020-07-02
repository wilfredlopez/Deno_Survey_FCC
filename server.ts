import { Application, green, yellow } from "./deps.ts";
import router from "./router.ts";
import { PORT } from "./constants.ts";
import staticFileMiddleware from "./middleware/staticFileMiddleware.ts";
const app = new Application();
const controller = new AbortController();
const { signal } = controller;

// Logger
app.use(async (ctx, next) => {
  await next();
  const responseTime = ctx.response.headers.get("X-Response-Time");
  console.warn(
    yellow("[Server] "),
    `${ctx.request.method} ${ctx.request.url} - ${responseTime}`,
  );
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const milliseconds = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${milliseconds}ms`);
});

app.addEventListener("error", (errorEvent) => {
  console.error(yellow(`[Server] `), `${errorEvent.error}`);
  controller.abort();
});

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.warn(
    yellow("[Server]"),
    green(
      `Listening on ${secure ? "https" : "http"}://${hostname ||
        "localhost"}:${port}. `,
    ),
  );
});

// Apply Router
app.use(staticFileMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

const listenPromise = app.listen({ port: +PORT, signal });

try {
  // Listen will stop listening for requests and the promise will resolve...
  await listenPromise;
} catch (error) {
  console.error(yellow(`[Server] `), `${error}`);
  controller.abort();
}
