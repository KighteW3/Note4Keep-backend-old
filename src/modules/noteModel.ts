import { Schema, model } from "mongoose";

const noteShema = new Schema({
  note_id: String,
  title: String,
  priority: Number,
  text: String,
  user: String,
});

export const notes = model("notes", noteShema);