import { usersCollection } from "../mongo.ts";
import { hashSync, compareSync } from "../deps.ts";
import BaseModel from "./BaseModel.ts";
interface UserProps {
  name: string;
  email: string;
  password: string;
}

export default class User extends BaseModel {
  public name: string;
  public email: string;
  public password: string;
  protected static collection = usersCollection;
  mongoCollection = usersCollection;
  //   public id: string = '';

  static hashPassword(password: string) {
    return hashSync(password);
  }
  static comparePassword(passwordToCompare: string, correctPassword: string) {
    return compareSync(passwordToCompare, correctPassword);
  }

  constructor(
    { email, name, password }: UserProps,
  ) {
    super();
    this.email = email;
    this.name = name;
    this.password = password;
    // this.id = id || "";
  }
}
