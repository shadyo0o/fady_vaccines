import { Schema, model } from "mongoose";

const informationSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['نصائح_طبية', 'تغذية', 'رضاعة', 'تطور_النمو', 'أسنان'], 
        required: true 
    },
    image: { type: String }, // رابط الصورة إذا وُجدت
    minAgeMonths: { type: Number, default: 0 }, // لإظهار النصيحة في سن معين
    maxAgeMonths: { type: Number, default: 24 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const informationModel = model("Information", informationSchema);
export default informationModel;