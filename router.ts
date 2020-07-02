import { Router } from "./deps.ts";
import AuthController from "./controllers/AuthController.ts";
import SurveyController from "./controllers/SurveyController.ts";
import { authMiddleware } from "./middleware/authMiddleware.ts";
import QuestionController from "./controllers/QuestionController.ts";
import SiteController from "./controllers/SiteController.ts";
import { renderView } from "./helpers.ts";
const router = new Router({});

router
  //FONT_END
  .get("/", SiteController.surveys.bind(SiteController))
  .get("/answers", SiteController.answers.bind(SiteController))
  .get("/survey/:id", SiteController.viewSurvey.bind(SiteController))
  .post("/survey/:id", SiteController.submitSurvey.bind(SiteController))
  //BACK_END
  //Auth
  // .get("/test", AuthController.getAllUsers.bind(AuthController))
  .post("/api/login", AuthController.login.bind(AuthController))
  .post("/api/register", AuthController.register.bind(AuthController))
  //Surveys
  // .get(
  //   "/api/survey/test",
  //   authMiddleware,
  //   SurveyController.test.bind(SurveyController),
  // )
  .get(
    "/api/survey",
    authMiddleware,
    SurveyController.getUserSurveys.bind(SurveyController),
  )
  .get(
    "/api/survey/:id",
    authMiddleware,
    SurveyController.getOne.bind(SurveyController),
  )
  .post(
    "/api/survey",
    authMiddleware,
    SurveyController.create.bind(SurveyController),
  )
  .put(
    "/api/survey/:id",
    authMiddleware,
    SurveyController.update.bind(SurveyController),
  )
  .delete(
    "/api/survey/:id",
    authMiddleware,
    SurveyController.delete.bind(SurveyController),
  )
  //Questions
  // .get(
  //   "/api/questions/test",
  //   authMiddleware,
  //   QuestionController.test.bind(QuestionController),
  // )
  .get(
    "/api/survey/:surveyId/questions",
    authMiddleware,
    QuestionController.getBySurvey.bind(QuestionController),
  )
  .get(
    "/api/question/:id",
    authMiddleware,
    QuestionController.getOne.bind(QuestionController),
  )
  .post(
    "/api/question/:surveyId",
    authMiddleware,
    QuestionController.create.bind(QuestionController),
  )
  .put(
    "/api/question/:id",
    authMiddleware,
    QuestionController.update.bind(QuestionController),
  )
  .delete(
    "/api/question/:id",
    authMiddleware,
    QuestionController.delete.bind(QuestionController),
  ).get("/:all*", async (ctx) => {
    ctx.response.status = 404;
    ctx.response.body = await renderView("404");
  });

export default router;
