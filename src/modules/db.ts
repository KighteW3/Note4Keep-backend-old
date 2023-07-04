import mongoose from "mongoose";

const URI = process.env.MONGO_DB_URI || '';

mongoose.connect(URI)
  .then(() => {
    console.log('Database connected')
  })
  .catch((e) => {
    console.error(e)
  })