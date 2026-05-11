import mongoose from "mongoose"

const landMarkSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    region:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    type:{
        type:String
    },
    date_of_establishment:{
        type:String
    },
    significance:{
        type:String
    },
    unesco_status:{
        type:String
    },
    visitor_info:{
        fee:{
            type:String
        },
        opening_hours:{
            type:String
        }
    },
    gallery:{
        type:[String]
    },
    rating: {
      type: Number,
      default: 0,
    },

    embedding: [Number],
    
    
},{timestamps:true});

const Landmark=mongoose.model('landmark',landMarkSchema);

export default Landmark;
