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

/*---------------------------------------
 * MAKING SURE TYPESCRIPT SUPPORT IS CORRECT
 * --------------------------------------*/

//  // Defining schema interface
// interface UserSchema {
//   // _id: { $oid: string };
//   username: string;
//   password: string;
// }

// const users = db.collection<UserSchema>("users");

// // insert
// const insertId = await users.insertOne({
//   username: "user1",
//   password: "pass1",
// });

// // insertMany
// const insertIds = await users.insertMany([
//   {
//     username: "user1",
//     password: "pass1",
//   },
//   {
//     username: "user2",
//     password: "pass2",
//   },
// ]);

// // findOne
// const user1 = await users.findOne({ _id: insertId });

// // Returns:
// // { _id: { $oid: "<oid>" }, username: "user1", password: "pass1" }

// // find
// const all_users = await users.find({ username: { $ne: null } });

// // find by ObjectId
// const user1_id = await users.findOne(
//   { _id: { "$oid": "<oid>" } },
// );

// // count
// const count = await users.count({ username: { $ne: null } });

// // aggregation
// const docs = await users.aggregate([
//   { $match: { username: "many" } },
//   { $group: { _id: "$username", total: { $sum: 2 } } },
// ]);

// // updateOne
// const { matchedCount, modifiedCount, upsertedId } = await users.updateOne(
//   { username: { $ne: null } },
//   { $set: { username: "USERNAME" } },
// );

// ////$date:
// // updateMany
// const {
//   matchedCount:matchedCount2,
//   modifiedCount:modifiedCount2,
//   upsertedId:upsertedId2,
// } = await users.updateMany(
//   { username: { $ne: null } },
//   { $set: { username: "USERNAME" } },
// );

// // deleteOne
// const deleteCount = await users.deleteOne({ _id: insertId });

// // deleteMany
// const deleteCount2 = await users.deleteMany({ username: "test" });
