import mongoose from "mongoose";

const eventRSVPSchema=new mongoose.Schema({
    event_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Event',
        required:[true,'Event id is required']
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
    number_of_tickets:{
        type:Number,
        required:true
    },
    total_price:{
        type:Number,
        required:true
    }
},{timestamps:true});

const EventBooking=mongoose.model('eventBooking',eventRSVPSchema);

export default EventBooking;