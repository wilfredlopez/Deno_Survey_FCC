import {
  RouterContext,
} from "../deps.ts";
import Survey from "../models/Survey.ts";
import { renderView } from "../helpers.ts";
import Question from "../models/Question.ts";
import { answersCollection, Answer } from "../mongo.ts";

export interface AnswerResponse {
  //key = SurveyID
  [key: string]: {
    surveyId: string;
    surveyText: string;
    answers: Answer[];
    questions: Question[];
    resumen: Resumen[];
  };
}

export interface Resumen {
  questionId: string;
  questionText: string;
  surveyId: string;
  answers: string[];
  date: string | null;
  userAgent: string | null;
}

class SiteController {
  async answers(context: RouterContext) {
    const surveys = await Survey.findAll<Survey>();
    const questions = await Question.findAll<Question>();
    const allAnswers = await answersCollection.find();
    let res: AnswerResponse = {};
    for (let survey of surveys) {
      const currentAnswers = allAnswers.filter((a) => a.surveyId === survey.id);
      const currentQuestions = questions.filter((q) =>
        q.surveyId === survey.id
      );

      for (let q of currentQuestions) {
        const ans = currentAnswers.map((a) => a.answers).map((obj) => {
          return obj[q.id] as string;
        });
        const unique = currentAnswers.filter((a) => a.answers[q.id]);

        const resumen: Resumen = {
          questionId: q.id,
          questionText: q.text,
          surveyId: q.surveyId,
          answers: ans,
          date: unique[0] ? unique[0].date.toString() : null,
          userAgent: unique[0] ? unique[0].userAgent : null,
        };
        if (!res[survey.id]) {
          res[survey.id] = {
            answers: currentAnswers,
            questions: currentQuestions,
            surveyId: survey.id,
            surveyText: survey.name,
            resumen: [resumen],
          };
        } else {
          res[survey.id].resumen.push(resumen);
        }
      }
    }

    const answers = Object.values(res);

    //FRONT-END MOCK RENDER.
    // for (let data of answers) {
    //   //Render Title
    //   console.log(data.surveyText);
    //   for (let resumen of data.resumen) {
    //     //Render More Info => Date and UserAgent.
    //     console.log(resumen.date);
    //     console.log(resumen.userAgent);
    //     if (resumen.answers.length > 0) {
    //       //render Question
    //       console.log(resumen.questionText);
    //       resumen.answers.map((ans) => {
    //         console.log(ans);
    //         //render answer
    //       });
    //     }
    //   }
    // }
    context.response.body = await renderView("answers", { questions, answers });
  }
  async surveys(context: RouterContext) {
    let surveys = await Survey.findAll<Survey>();
    surveys = surveys.map((s) => {
      const id = s.id;
      s = new Survey(s);
      s.id = id;
      return s;
    });
    context.response.body = await renderView("surveys", { surveys });
    // context.response.body = await dejs.renderFileToString(
    //   BASE_PATH+'surveys.ejs',
    //   { surveys },
    // );
  }

  async submitSurvey(context: RouterContext) {
    const id = context.params.id as string;
    try {
      const survey = await Survey.findById(id);
      if (!survey) {
        context.response.status = 404;
        context.response.body = await renderView("404");
        return;
      }

      const { type, value } = await context.request.body();

      if (type !== "form-data") {
        context.response.status = 400;
        context.response.body =
          'Content type most be multipart/form-data. eg. enctype="multipart/form-data"';
        return;
      }
      const { fields: formData } = await value.read() as {
        fields: { [key: string]: any };
      };
      const errors: { [key: string]: string } = {};
      const answers: { [key: string]: string | string[] | null } = {};
      const questions = await Question.findBySurveyId(id);
      for (const question of questions) {
        let value: string | null = formData[question.id];
        if (question.isMultipleChoise()) {
          value = formData[question.id];
        }
        if (question.required) {
          if (!value || value.trim() === "") {
            errors[question.id] = "This field is required.";
          }
          if (value && value.length === 0 && !question.isText()) {
            errors[question.id] = "This field is required.";
          }
        }
        answers[question.id] = value;
      }
      if (Object.keys(errors).length > 0) {
        context.response.body = await renderView(
          "single-survey",
          { survey, questions, errors, answers },
        );
        return;
      } else {
        const { $oid } = await answersCollection.insertOne({
          date: new Date(),
          surveyId: id,
          userAgent: context.request.headers.get("User-Agent") || "unknown",
          answers,
        });

        context.response.body = await renderView(
          "surveyFinish",
          { answerId: $oid },
        );
      }
    } catch (e) {
      console.error(e);
      context.response.status = 500;
      context.response.body = "Server error.";
      return;
    }
  }
  async viewSurvey(context: RouterContext) {
    const id = context.params.id as string;
    try {
      const survey = await Survey.findById(id);
      if (!survey) {
        context.response.status = 404;
        context.response.body = await renderView("404");
        return;
      }

      let questions = await Question.findBySurveyId(survey.id);
      // questions = questions.map((q) => new Question(q));
      context.response.body = await renderView(
        "single-survey",
        { survey, questions, errors: {}, answers: {} },
      );
    } catch (error) {
      console.error(error);
      context.response.status = 500;
      //   this.sendNotFoundPage(context);
    }
  }
}

const siteController = new SiteController();

export default siteController;
