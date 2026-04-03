import mongoose from "mongoose"

const carBookingSchema=new mongoose.Schema({
    car_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Car',
        required:[true,'Car id is required']
    },
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true,'User id is required']
    },
    payment_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Payment',
        required:[true,'Payment id is required']
    },
    pick_up_date:{
        type:Date,
        required:true
    },
    return_date:{
        type:Date,
        required:true
    },
    total_price: {
        type: Number,
        required:true
    },
    
},{timestamps:true});

const CarBooking=mongoose.model('carBooking',carBookingSchema);

export default CarBooking;
