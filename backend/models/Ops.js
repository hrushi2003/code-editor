import mongoose from "mongoose";

const OpsSchema = new mongoose.Schema({
    codeId: { type: mongoose.Schema.Types.ObjectId, ref: 'codes', required: true },
    version: { type: Number, required: true },
    payload: {
        startIndx : { type: Number, required: true },
        endIndx : { type: Number, required: true },
        newLines : { type: [String], required: true },
        startColumn : { type: Number, required: true },
        endColumn : { type: Number, required: true },
        deleteCount : { type: Number, required: true }
    },
    changedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user',
        required : true
    },
    timestamps: {
        type: Date,
        default: Date.now
    }
});

export const Ops = mongoose.model('ops', OpsSchema);