import { MongoClient } from "./deps.ts";
import { DATABASE_NAME, MONGO_URL } from "./constants.ts";
const client = new MongoClient();

client.connectWithUri(
  `${MONGO_URL}/${DATABASE_NAME}`,
);

const db = client.database(DATABASE_NAME);
export const usersCollection = db.collection("users");
export const surveyCollection = db.collection("surveys");
export const questionsCollection = db.collection("questions");

export interface Answer {
  surveyId: string;
  date: Date;
  userAgent: string;
  answers: { [key: string]: string | string[] | null };
}

//Modified mongo library in order to be able to use Generics and get completition.
export const answersCollection = db.collection<Answer>("answers");
