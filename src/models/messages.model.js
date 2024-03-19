import mongoose from "mongoose";

const messagesCollection = 'messsages';

const messageSchema = new mongoose.Schema({
    user: {
        type: String,
    },
    message: {
        type:Array,
        default:[]
    }
})

export const messagesModel = mongoose.model(messagesCollection, messageSchema)