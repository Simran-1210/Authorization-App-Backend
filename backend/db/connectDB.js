import mongoose from "mongoose";

const connectDB = (url) => { // No type annotations in JavaScript
  mongoose.set("strictQuery", true);
  mongoose
    .connect(url)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.log(error));
};

export default connectDB;
