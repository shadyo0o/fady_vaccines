
// =========================== بعد النصايح و الارشادات و تنبيه بالحملات =============

import childModel, { officeEnum } from "../../DB/models/Child/Child.js";
import administeredVaccineModel from "../../DB/models/AdministeredVaccine/AdministeredVaccine.js";
import VaccineScheduleModel from "../../DB/models/VaccineSchedule/VaccineSchedule.js";
import announcementModel from "../../DB/models/Announcement/Announcement.js";
import { calculateNextDoseDate } from "../../utils/vaccineCalculations.js";
import { getVaccineAdvice } from "../../utils/getVaccineAdvice.js";

// --- دوال مساعدة (Helpers) ---

const daysArabic = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const formatDateManual = (date) => date.toISOString().split('T')[0];

const getNextWorkingDay = (baseDate, allowedDays) => {
    let date = new Date(baseDate);
    // إذا لم تكن هناك أيام محددة (مثل حالة الدرن في شبرا)
    if (!allowedDays || allowedDays.length === 0) return date;
    
    while (!allowedDays.includes(date.getDay())) {
        date.setDate(date.getDate() + 1);
    }
    return date;
};

const getAllowedDays = (officeName, vaccineTitle, dueInMonths) => {
    // 1. الكبدي B: متاح يومياً في كل المكاتب (أول 24 ساعة)
    if (vaccineTitle.includes("التهاب الكبد")) return [0, 1, 2, 3, 4, 5, 6]; 

    // 2. مكتب رعاية شبرا (منع الدرن تماماً)
    if (officeName === "رعاية_طفل_شبرا_ميدان_الساعة" && vaccineTitle.includes("الدرن")) {
        return []; 
    }

    // 3. مكتب الهلال القديم (التقسيم التفصيلي الجديد)
    if (officeName === "الهلال_القديم") {
        if (dueInMonths === 9 || vaccineTitle.includes("الصفرية")) return [0, 1, 2, 3, 4, 6];
        if (vaccineTitle.includes("الدرن")) return [2, 6];
        if ([2, 4, 6].includes(dueInMonths)) return [1, 3, 6]; // سبت، اثنين، أربعاء
        if ([12, 18].includes(dueInMonths)) return [0, 2, 4]; // أحد، ثلاثاء، خميس
    }

    // 4. مكتب صحة أول
    if (officeName === "صحة_أول_مديرية_الصحة") {
        if (dueInMonths === 12 || dueInMonths === 18 || vaccineTitle.includes("الدرن")) return [6];
        return [2, 4, 6];
    }

    // 5. مكتب عمارة برغش
    if (officeName === "عمارة_برغش") {
        if (vaccineTitle.includes("الدرن")) return [2, 6];
        return [0, 1, 2, 3, 4, 6];
    }

    return [2, 6]; // الافتراضي لباقي المكاتب (سبت وثلاثاء)
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

        const officeName = office || child.healthOffice;
        const administered = await administeredVaccineModel.find({ child: id });
        const takenIds = administered.map(rec => rec.vaccineSchedule.toString());
        const allSchedules = await VaccineScheduleModel.find().sort({ dueInMonths: 1 }).populate('vaccine');

        const result = { info: [], taken: [], overdue: [], nextVaccine: null, upcoming: [] };

        // --- أولاً: إضافة معلومات الغدة والسمع (Static Info) ---
        const ghoddaBaseDate = new Date(child.birthDate);
        ghoddaBaseDate.setDate(ghoddaBaseDate.getDate() + 3); // بعد 72 ساعة
        const ghoddaDate = getNextWorkingDay(ghoddaBaseDate, [2, 6]); // سبت وثلاثاء

        result.info.push({
            title: "تحليل الغدة الدرقية واختبار السمع",
            expectedDate: formatDateManual(ghoddaDate),
            dayName: daysArabic[ghoddaDate.getDay()],
            advice: "يتم التحليل بعد 72 ساعة من الولادة وحتى أسبوع، يومي السبت والثلاثاء فقط بجميع المكاتب."
        });

        // --- ثانياً: معالجة جدول التطعيمات ---
        let foundNext = false;

        for (const schedule of allSchedules) {
            const isTaken = takenIds.includes(schedule._id.toString());
            let finalDate;

            if (isTaken) {
                const adminRecord = administered.find(r => r.vaccineSchedule.toString() === schedule._id.toString());
                finalDate = new Date(adminRecord.administeredDate);
            } else {
                let baseDate = new Date(child.birthDate.getFullYear(), child.birthDate.getMonth() + schedule.dueInMonths, child.birthDate.getDate());
                
                // حالة الكبدي B (أول 24 ساعة)
                if (schedule.dueInMonths === 0 && schedule.title.includes("التهاب الكبد")) {
                    finalDate = new Date(child.birthDate);
                } else {
                    const allowed = getAllowedDays(officeName, schedule.title, schedule.dueInMonths);
                    finalDate = getNextWorkingDay(baseDate, allowed);
                }
            }

            const data = {
                ...schedule._doc,
                expectedDate: formatDateManual(finalDate),
                dayName: daysArabic[finalDate.getDay()],
                isTaken,
                advice: ""
            };

            // إضافة نصيحة خاصة بمكتب شبرا والدرن
            if (officeName === "رعاية_طفل_شبرا_ميدان_الساعة" && schedule.title.includes("الدرن")) {
                data.advice = "⚠️ تطعيم الدرن غير متوفر في رعاية شبرا، يرجى التوجه لمكتب الهلال أو برغش يومي السبت أو الثلاثاء.";
            }

            if (isTaken) result.taken.push(data);
            else {
                if (finalDate < today) result.overdue.push(data);
                else if (!foundNext) { result.nextVaccine = data; foundNext = true; }
                else result.upcoming.push(data);
            }
        }

        res.status(200).json({ 
            message: "Success", 
            childName: child.name, 
            currentOffice: officeName, 
            results: result 
        });

    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

// 4. جلب موعد التطعيم القادم (يدعم اختيار المكتب عبر Query)

// دالة جلب الموعد القادم مع مراعاة الغدة وتحذير شبرا
export const getNextVaccineDate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { office } = req.query; 

        const child = await childModel.findById(id);
        if (!child) return res.status(404).json({ message: "الطفل غير موجود" });

        const officeName = office || child.healthOffice || "عمارة_برغش";
        const today = new Date(); today.setHours(0, 0, 0, 0);

        // 1. فحص تحليل الغدة أولاً (كإجراء ستاتيك)
        const ghoddaBase = new Date(child.birthDate);
        ghoddaBase.setDate(ghoddaBase.getDate() + 3);
        const ghoddaDate = getNextWorkingDay(ghoddaBase, [2, 6]);

        if (ghoddaDate >= today) {
            return res.status(200).json({
                message: "Success",
                nextTask: {
                    title: "تحليل الغدة والسمع",
                    date: formatDateManual(ghoddaDate),
                    day: daysArabic[ghoddaDate.getDay()],
                    advice: "بعد 72 ساعة من الولادة (سبت وثلاثاء فقط)"
                }
            });
        }

        // 2. فحص التطعيمات الروتينية
        const administered = await administeredVaccineModel.find({ child: id });
        const takenIds = administered.map(a => a.vaccineSchedule.toString());
        const allSchedules = await VaccineScheduleModel.find().sort({ dueInMonths: 1 });

        for (const schedule of allSchedules) {
            if (takenIds.includes(schedule._id.toString())) continue;

            let baseDate = new Date(child.birthDate.getFullYear(), child.birthDate.getMonth() + schedule.dueInMonths, child.birthDate.getDate());
            
            // تطبيق قواعد المكاتب
            const allowed = getAllowedDays(officeName, schedule.title, schedule.dueInMonths);
            const finalDate = getNextWorkingDay(baseDate, allowed);

            if (finalDate >= today) {
                return res.status(200).json({
                    message: "Success",
                    nextVaccine: {
                        title: schedule.title,
                        date: formatDateManual(finalDate),
                        day: daysArabic[finalDate.getDay()],
                        office: officeName.replace(/_/g, ' '),
                        warning: (officeName === "رعاية_طفل_شبرا_ميدان_الساعة" && schedule.title.includes("الدرن")) 
                                 ? "⚠️ الدرن غير متاح في شبرا" : ""
                    }
                });
            }
        }

        res.status(200).json({ message: "لا توجد تطعيمات قادمة" });
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