import mongoose, { Mongoose } from "mongoose";

const code = new mongoose.Schema({
    codeName : {
        type : String,
        required : true
    },
    users : {
        type : [
        {
        userId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'user'
        }
        }
    ]},
    leader : {type : mongoose.Schema.Types.ObjectId, required : true, default : null},
    code : {type : [String]}
})

export const CodeSchema = mongoose.model('codes',code);