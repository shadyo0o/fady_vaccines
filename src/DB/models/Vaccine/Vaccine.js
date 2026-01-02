import mongoose from "mongoose";



const vaccineSchema = mongoose.Schema({
    name:{type:String,required:true,unique:true},
    description:String
})

const vaccineModel = mongoose.models.Vaccine || mongoose.model("Vaccine",vaccineSchema)

export default vaccineModel







