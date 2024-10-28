import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({path:"sample.env"});
export const connect = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URL,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error connecting to MongoDB:", error);
    }
}
