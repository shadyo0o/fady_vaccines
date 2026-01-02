
// =========================== بعد النصايح و الارشادات و تنبيه بالحملات =============

import childModel, { officeEnum } from "../../DB/models/Child/Child.js";
import administeredVaccineModel from "../../DB/models/AdministeredVaccine/AdministeredVaccine.js";
import VaccineScheduleModel from "../../DB/models/VaccineSchedule/VaccineSchedule.js";
import announcementModel from "../../DB/models/Announcement/Announcement.js";
import { calculateNextDoseDate } from "../../utils/vaccineCalculations.js";
import { getVaccineAdvice } from "../../utils/getVaccineAdvice.js";

/** * --- Helper Functions (دوال مساعدة) --- 
 */

// حساب اليوم التالي المتاح بناءً على مواعيد المكتب
const getNextWorkingDay = (baseDate, allowedDays) => {
    let date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 0, 0);
    if (!allowedDays || allowedDays.length === 0) return null;
    let safetyNet = 0; 
    while (!allowedDays.includes(date.getDay()) && safetyNet < 14) {
        date.setDate(date.getDate() + 1);
        safetyNet++;
    }
    return date;
};

const daysArabic = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const formatDateManual = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// منطق توزيع أيام العمل حسب مكتب الصحة في دمنهور
const getAllowedDays = (officeName, title, dueInMonths) => {
    if (title.includes("الغدة") || title.includes("السمع")) return [6, 2];

    if (officeName === officeEnum.الهلال_القديم) {
        if (title.includes("الدرن")) return [6, 2];
        if (dueInMonths === 9) return [0, 1, 2, 3, 4, 6]; 
        return [2, 4, 6].includes(dueInMonths) ? [6, 1, 3] : [0, 2, 4];
    } 
    else if (officeName === officeEnum.صحة_اول_مديرية_الصحة) {
        return (title.includes("الدرن") || [12, 18].includes(dueInMonths)) ? [6] : [6, 2, 4];
    } 
    else if (officeName === officeEnum.رعايه_طفل_شبرا_ميدان_الساعه) {
        return [6, 2]; 
    } 
    else if (officeName === officeEnum.عمارة_برغش) {
        return title.includes("الدرن") ? [6, 2] : [0, 1, 2, 3, 4, 6];
    }
    return [0, 1, 2, 3, 4, 6]; 
};

/** * --- Main Service Functions (الدوال الأساسية) --- 
 */

// 1. إضافة طفل جديد


export const addChild = async (req, res, next) => {
    try {
        const { name, birthDate, healthOffice, gender } = req.body;

        // تحويل النص إلى كائن تاريخ وتصفير الساعات لضمان ثبات اليوم
        const date = new Date(birthDate);
        const fixedBirthDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0); 
        // ملاحظة: ضبط الساعة على 12 ظهراً يضمن بقاء التاريخ في نفس اليوم حتى مع فروق التوقيت

        const child = await childModel.create({
            name, 
            birthDate: fixedBirthDate, 
            healthOffice, 
            gender, 
            parent: req.user.id
        });

        res.status(201).json({ message: "Success", child });
    } catch (error) {
        res.status(500).json({ message: "Error adding child", error: error.message });
    }
};

// 2. جلب قائمة الأطفال
export const getAll = async (req, res) => {
    try {
        const child = await childModel.find({ parent: req.user.id });
        res.status(200).json({ message: "Success", child });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

// 3. جلب جدول التطعيمات المخصص (يدعم اختيار المكتب عبر Query)
export const getDueVaccines = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { office } = req.query; 
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const child = await childModel.findById(id);
        if (!child) return res.status(404).json({ message: "الطفل غير موجود" });

        const officeName = office || child.healthOffice || officeEnum.عمارة_برغش;
        const administered = await administeredVaccineModel.find({ child: id }).sort({ administeredDate: 1 });
        const takenIds = administered.map(rec => rec.vaccineSchedule.toString());
        const allSchedules = await VaccineScheduleModel.find().sort({ dueInMonths: 1 }).populate('vaccine');

        const result = { taken: [], overdue: [], nextVaccine: null, upcoming: [] };
        let foundNext = false, lastActualDate = null, lastDueMonth = 0;

        for (const schedule of allSchedules) {
            const isTaken = takenIds.includes(schedule._id.toString());
            let finalDate;

            if (isTaken) {
                const adminRecord = administered.find(r => r.vaccineSchedule.toString() === schedule._id.toString());
                finalDate = new Date(adminRecord.administeredDate);
                lastActualDate = finalDate; lastDueMonth = schedule.dueInMonths;
            } else {
                let baseDate = lastActualDate 
                    ? calculateNextDoseDate(child.birthDate, lastActualDate, schedule.dueInMonths - lastDueMonth)
                    : new Date(child.birthDate.getFullYear(), child.birthDate.getMonth() + schedule.dueInMonths, child.birthDate.getDate());
                finalDate = getNextWorkingDay(baseDate, getAllowedDays(officeName, schedule.title, schedule.dueInMonths));
            }

            const data = {
                ...schedule._doc,
                expectedDate: formatDateManual(finalDate),
                dayName: daysArabic[finalDate.getDay()],
                isTaken,
                advice: getVaccineAdvice(schedule.dueInMonths)
            };

            if (isTaken) result.taken.push(data);
            else {
                if (finalDate < today) result.overdue.push(data);
                else if (!foundNext) { result.nextVaccine = data; foundNext = true; }
                else result.upcoming.push(data);
            }
        }
        res.status(200).json({ message: "Success", childName: child.name, currentOffice: officeName, data: result });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

// 4. جلب موعد التطعيم القادم (يدعم اختيار المكتب عبر Query)

export const getNextVaccineDate = async (req, res, next) => {
    try {
        const { id } = req.params;
        // استقبال اسم المكتب من الـ query (اختياري)
        const { office } = req.query; 

        const child = await childModel.findById(id);
        if (!child) return res.status(404).json({ message: "الطفل غير موجود" });

        // تحديد المكتب: الأولوية لـ query، ثم المسجل للطفل، ثم الافتراضي عمارة برغش
        const officeName = office || child.healthOffice || officeEnum.عمارة_برغش;
        const today = new Date(); 
        today.setHours(0, 0, 0, 0);

        // جلب التطعيمات التي أخذها الطفل مرتبة
        const administered = await administeredVaccineModel.find({ child: id }).sort({ administeredDate: 1 });
        const takenIds = administered.map(a => a.vaccineSchedule.toString());
        
        // جلب كافة مخططات التطعيمات مرتبة حسب الشهور
        const allSchedules = await VaccineScheduleModel.find().sort({ dueInMonths: 1 });

        let nextVaccine = null;
        let lastActualDate = null;
        let lastDueMonth = 0;

        for (const schedule of allSchedules) {
            const isTaken = takenIds.includes(schedule._id.toString());
            
            if (isTaken) {
                // إذا كان التطعيم مأخوذاً، نحدث تاريخ "آخر تطعيم فعلي" لنبني عليه الموعد القادم
                const adminRecord = administered.find(r => r.vaccineSchedule.toString() === schedule._id.toString());
                lastActualDate = new Date(adminRecord.administeredDate);
                lastDueMonth = schedule.dueInMonths;
                continue;
            }

            // حساب التاريخ المبدئي (Base Date)
            let baseDate = lastActualDate 
                ? calculateNextDoseDate(child.birthDate, lastActualDate, schedule.dueInMonths - lastDueMonth)
                : new Date(child.birthDate.getFullYear(), child.birthDate.getMonth() + schedule.dueInMonths, child.birthDate.getDate());

            // تحديد اليوم الفعلي بناءً على أيام عمل المكتب المحدد
            const finalDate = getNextWorkingDay(baseDate, getAllowedDays(officeName, schedule.title, schedule.dueInMonths));

            // اختيار أول تطعيم لم يأتِ موعده بعد (أو موعده اليوم)
            if (finalDate >= today) {
                nextVaccine = {
                    title: schedule.title,
                    date: formatDateManual(finalDate),
                    day: daysArabic[finalDate.getDay()],
                    office: officeName.replace(/_/g, ' '),
                    dueInMonths: schedule.dueInMonths
                };
                break; // نخرج بمجرد إيجاد أول تطعيم قادم
            }
        }

        if (!nextVaccine) {
            return res.status(200).json({ 
                message: "Success", 
                nextVaccine: "لا توجد تطعيمات قادمة مجدولة" 
            });
        }

        res.status(200).json({ 
            message: "Success", 
            currentOffice: officeName.replace(/_/g, ' '), 
            nextVaccine 
        });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

// 5. تسجيل أخذ جرعة (تخزين اسم المكتب الذي تم فيه التطعيم)


export const recordVaccine = async (req, res, next) => {
    try {
        const { childId, scheduleId, actualDate, office, notes } = req.body;

        // 1. التأكد من وجود الطفل وتابعيته للمستخدم
        const child = await childModel.findOne({ _id: childId, parent: req.user.id });
        if (!child) return res.status(404).json({ message: "الطفل غير موجود" });

        // 2. التحقق من أن الـ scheduleId المرسل موجود فعلاً في قاعدة البيانات (هذا الجزء المفقود)
        const scheduleExists = await VaccineScheduleModel.findById(scheduleId);
        if (!scheduleExists) {
            return res.status(404).json({ message: "هذا التطعيم غير موجود في سجلات المواعيد، تأكد من الـ ID" });
        }

        // 3. منع التكرار (التحقق من تسجيله مسبقاً)
        const alreadyAdministered = await administeredVaccineModel.findOne({ 
            child: childId, 
            vaccineSchedule: scheduleId 
        });

        if (alreadyAdministered) {
            return res.status(400).json({ message: "هذا التطعيم مسجل مسبقاً لهذا الطفل" });
        }

        // 4. تثبيت تاريخ التطعيم ليكون في منتصف اليوم لتجنب ترحيله بسبب الـ UTC
        const dateInput = actualDate ? new Date(actualDate) : new Date();
        const fixedAdministeredDate = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 12, 0, 0);

        // 5. إنشاء السجل
        await administeredVaccineModel.create({
            child: childId,
            vaccineSchedule: scheduleId,
            administeredDate: fixedAdministeredDate,
            office: office || child.healthOffice,
            notes: notes 
        });

        res.status(201).json({ message: "تم تسجيل التطعيم بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};


// 6. جلب سجل التطعيمات التاريخي - النسخة المصححة


export const getVaccineHistory = async (req, res, next) => {
    try {
        const { id } = req.params; 
        const child = await childModel.findOne({ _id: id, parent: req.user.id });
        if (!child) return res.status(404).json({ message: "الطفل غير موجود" });

        // جلب التطعيمات مع عمل populate لجدول المواعيد لجلب العنوان
        const history = await administeredVaccineModel.find({ child: id })
            .populate({ path: 'vaccineSchedule', select: 'title' }) 
            .sort({ administeredDate: -1 });

        res.status(200).json({
            message: "Success",
            childName: child.name,
            history: history.map(item => ({
                // التأكد من استخراج العنوان من الحقل الذي تم عمل populate له
                title: item.vaccineSchedule?.title || "تطعيم خاص", 
                administeredDate: formatDateManual(item.administeredDate),
                day: daysArabic[item.administeredDate.getDay()],
                office: item.office ? item.office.replace(/_/g, ' ') : "غير محدد",
                notes: item.notes || "" // عرض ملاحظات الآثار الجانبية إن وجدت
            }))
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching history", error: error.message });
    }
};

// 7. إدارة التنبيهات (Announcements)
export const getActiveAnnouncements = async (req, res) => {
    try {
        const today = new Date();
        // ضبط الوقت لبداية اليوم لضمان دقة المقارنة بالتواريخ فقط
        today.setHours(0, 0, 0, 0);

        const announcements = await announcementModel.find({
            isActive: true,
            startDate: { $lte: today }, // التنبيه بدأ بالفعل
            endDate: { $gte: today }    // التنبيه لم ينتهِ بعد
        })
        .select('title content type startDate endDate') 
        .sort({ createdAt: -1 }); // عرض الأحدث أولاً

        res.status(200).json({ 
            message: "Success", 
            count: announcements.length, 
            announcements 
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching announcements", error: error.message });
    }
};

export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, type, startDate, endDate } = req.body;

        // التحقق من منطقية التواريخ قبل الإنشاء
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: "تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية" });
        }

        const announcement = await announcementModel.create({
            title, 
            content, 
            type: type || 'info', // أنواع مثل: 'campaign' (حملة قومية), 'info', 'warning'
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: true
        });

        res.status(201).json({ message: "تم إنشاء التنبيه بنجاح", announcement });
    } catch (error) {
        res.status(500).json({ message: "خطأ في إنشاء التنبيه", error: error.message });
    }
};