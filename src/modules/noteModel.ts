import { Schema, model } from "mongoose";

const noteShema = new Schema({
  note_id: String,
  title: String,
  priority: Number,
  text: String,
  user: String,
  date: Date
});

export const notes = model("notes", noteShema);