import mongoose from "mongoose";

const cartsCollection = 'carts';

const cartsSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    products: {
        type:[{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "products"
            },
            quantity: Number
        }],
        default:[]
    }
})

export const cartsModel = mongoose.model(cartsCollection, cartsSchema)