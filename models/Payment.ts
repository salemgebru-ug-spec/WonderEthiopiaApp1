import mongoose from "mongoose"

const paymentSchema=new mongoose.Schema({
    transaction_id:{
        type:String,
        required:true
    },
    amount:{
        type:String,
        required:true
    },
    method:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    check_out_url:{
        type:String
    }
    
},{timestamps:true});

const Payment=mongoose.model('payment',paymentSchema);

export default Payment;
