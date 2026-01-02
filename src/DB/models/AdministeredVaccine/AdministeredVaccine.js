

import { Schema, model, Types } from "mongoose";

const administeredVaccineSchema = new Schema({
    child: {
        type: Types.ObjectId,
        ref: "Child",
        required: true
    },
    vaccineSchedule: {
        type: Types.ObjectId,
        ref: "VaccineSchedule",
        required: true
    },
    // التاريخ الذي تم فيه التطعيم فعلياً (الذي يدخله المستخدم أو تاريخ اليوم)
    administeredDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    office: {
        type: String,
        
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const administeredVaccineModel = model("AdministeredVaccine", administeredVaccineSchema);

export default administeredVaccineModel;