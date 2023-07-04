import { Schema, model } from "mongoose";

const usersShema = new Schema({
  user_id: String,
  username: String,
  password: String,
  email: String,
  ip: String
});

export const users = model("users", usersShema);