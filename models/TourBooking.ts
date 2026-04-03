import mongoose from "mongoose";

const tourBookingSchema=new mongoose.Schema({
    tour_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Tour',
        required:[true,'Tour id is required']
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
    number_of_people:{
        type:Number,
        required:true
    },
    total_price:{
        type:Number,
        required:true
    }
},{timestamps:true});

const TourBooking=mongoose.model('tourBooking',tourBookingSchema);
export default TourBooking;