import mongoose from "mongoose";

export const genderEnum = {
    male:"male",
    female:"female"
}
export const providerEnum = {
    system:"system",
    google:"google"
}

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function(){return this.provider == providerEnum.system?true:false} },
    phone: { type: String , required:function(){return this.provider == providerEnum.system?true:false}  },
    // otp: { type: String },
    confirmed: { type: Boolean, default: false },
    gender:{type:String,enum:Object.values(genderEnum),default:genderEnum.female},
    provider:{type:String,enum:Object.values(providerEnum),default:providerEnum.system},
    fcmToken: { type: String, default: null }
},{timestamps:true});




const userModel = mongoose.models.User || mongoose.model('User', UserSchema);
export default userModel;
