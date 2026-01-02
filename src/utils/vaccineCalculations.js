


import VaccineScheduleModel from '../DB/models/VaccineSchedule/VaccineSchedule.js';

/**
 * 1. دالة حساب المواعيد الأولية عند تسجيل الطفل لأول مرة
 * تعتمد كلياً على تاريخ الميلاد
 */
export const calculateChildVaccines = async (birthDate) => {
    // جلب الجداول وترتيبها (موجودة عندك بالفعل)
    const schedules = await VaccineScheduleModel.find().populate('vaccine').sort({ dueInMonths: 1 });

    return schedules.map(item => {
        let expectedDate = new Date(birthDate);
        // إضافة الشهور لتاريخ الميلاد
        expectedDate.setMonth(expectedDate.getMonth() + item.dueInMonths);

        return {
            vaccineId: item.vaccine._id, // أضفنا الـ ID لتسهيل التعامل معه لاحقاً
            vaccineName: item.vaccine.name,
            doseTitle: item.title,
            expectedDate: expectedDate.toISOString().split('T')[0],
            dueInMonths: item.dueInMonths,
            status: 'pending' // حالة افتراضية
        };
    });
};

/**
 * 2. دالة حساب الموعد القادم بدقة (التعديل الجديد)
 * تستخدم عند تحديث جرعة تمت بالفعل لتحديد موعد الجرعة التي تليها
 */
export const calculateNextDoseDate = (birthDate, actualVaccineDate, gapInMonths) => {
    // المنطق الذي طلبته: الأولوية للتاريخ الفعلي ثم تاريخ الميلاد
    const referenceDate = actualVaccineDate ? new Date(actualVaccineDate) : new Date(birthDate);
    
    const nextDate = new Date(referenceDate);
    
    // إضافة الأشهر المطلوبة للجرعة التالية
    nextDate.setMonth(nextDate.getMonth() + gapInMonths);
    
    return nextDate;
};