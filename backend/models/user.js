import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {type : String, unique : true,required : true},
    email: String,
    password: {type : String, required : true},
});

export const User = mongoose.model('user',UserSchema);