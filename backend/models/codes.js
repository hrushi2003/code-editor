import mongoose from "mongoose";

const code = new mongoose.Schema({
    codeName : {
        type : String,
        required : true
    },
    language : {
        type : String,
        default : null
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
    version : {type : Number, default : 1},
    leader : {type : mongoose.Schema.Types.ObjectId, required : true, default : null},
    code : {type : [String]}
})

export const CodeSchema = mongoose.model('codes',code);