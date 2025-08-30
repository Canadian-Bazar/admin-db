import mongoose from "mongoose";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import paginate from 'mongoose-paginate-v2';

const Certifications = new mongoose.Schema({
    name:{
        type:String ,
        required:true,
        trim: true
    } ,

   isActive:{
    type:Boolean ,
    default:true
   } ,

   isDeleted:{
    type:Boolean ,
    default:false
   }

} , { timestamps: true  , collection:'Certifications'});

Certifications.plugin(paginate);
Certifications.plugin(aggregatePaginate);

export default mongoose.model('Certifications', Certifications);