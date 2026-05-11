import mongoose from "mongoose";

const roomBookingSchema=new mongoose.Schema({
    room_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Room',
        required:[true,'Room id is required']
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
    check_in_date:{
        type:Date,
        required:true
    },
    check_out_date: {
        type:Date,
        required:true
    },
    number_of_guests: {
        type:Number,
        required:true},
    total_price:{
        type: Number,
        required:true
    }
},{timestamps:true});

const RoomBooking=mongoose.model('roomBooking',roomBookingSchema);
export default RoomBooking;