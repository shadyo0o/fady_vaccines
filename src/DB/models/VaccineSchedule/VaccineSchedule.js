


import mongoose from "mongoose";

const VaccineScheduleSchema = new mongoose.Schema({
  vaccine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vaccine',
    required: true,
  },
  // أضفنا هذا الحقل لتخزين النص العربي الذي سيظهر للأم في التطبيق
  title: {
    type: String,
    required: true,
  },
  doseNumber: { 
    type: Number, // الآن سيبقى رقماً (0, 1, 2...) كما طلبت
    required: true,
  },
  dueInMonths: { 
    type: Number, 
    required: true,
  },
});

const VaccineScheduleModel = mongoose.model('VaccineSchedule', VaccineScheduleSchema);
export default VaccineScheduleModel;