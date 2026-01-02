


import mongoose, { Schema, model, Types } from "mongoose";
import { genderEnum } from "../User/User.model.js";

// تعريف المكاتب المتاحة لضمان عدم إدخال بيانات خاطئة (Enum)
export const officeEnum = {
    صحة_اول_مديرية_الصحة: "صحة_اول_مديرية_الصحة",
    رعايه_طفل_شبرا_ميدان_الساعه: "رعايه_طفل_شبرا_ميدان_الساعه",
    الهلال_القديم: "الهلال_القديم",
    عمارة_برغش: "عمارة_برغش"
};



const childSchema = new Schema({
    name: {
        type: String,
        required: [true, "اسم الطفل مطلوب"],
        trim: true,
        minlength: [3, "الاسم يجب أن يكون أكثر من 3 أحرف"]
    },
    birthDate: {
        type: Date,
        required: [true, "تاريخ ميلاد الطفل مطلوب"]
    },
    gender: {
        type: String,
        enum: Object.values(genderEnum),
        required: true
    },
    healthOffice: {
        type: String,
        enum: Object.values(officeEnum),
        default: officeEnum.عمارة_برغش
    },
    // ربط الطفل بحساب الوالد (User)
    parent: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true, // لتعرف متى تمت إضافة الطفل وتحديث بياناته
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// "Virtual Populate" لجلب التطعيمات المأخوذة بسهولة دون تخزينها في مصفوفة ثابتة
// هذا يقلل من حجم الوثيقة (Document Size) ويحسن الأداء في Mongo Atlas
childSchema.virtual('administeredVaccines', {
    ref: 'AdministeredVaccine',
    localField: '_id',
    foreignField: 'child'
});

const childModel =mongoose.models.Child ||model("Child", childSchema);

export default childModel;