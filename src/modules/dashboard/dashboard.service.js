
import userModel from "../../DB/models/User/User.model.js";
import childModel from "../../DB/models/Child/Child.js";
import administeredVaccineModel from "../../DB/models/AdministeredVaccine/AdministeredVaccine.js";
import announcementModel from "../../DB/models/Announcement/Announcement.js";
import VaccineScheduleModel from "../../DB/models/VaccineSchedule/VaccineSchedule.js";
import informationModel from "../../DB/models/Information/Information.js";
import { getVaccineAdvice } from "../../utils/getVaccineAdvice.js";

// --- Helpers copied from child.service.js to avoid circular deps or complex refactoring ---
const daysArabic = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const formatDateManual = (date) => date.toISOString().split('T')[0];

const getNextWorkingDay = (baseDate, allowedDays) => {
    let date = new Date(baseDate);
    if (!allowedDays || allowedDays.length === 0) return null;
    while (!allowedDays.includes(date.getDay())) {
        date.setDate(date.getDate() + 1);
    }
    return date;
};

const getAllowedDays = (officeName, vaccineTitle, dueInMonths) => {
    if (vaccineTitle.includes("التهاب الكبد")) return [0, 1, 2, 3, 4, 5, 6]; 
    if (vaccineTitle.includes("الدرن") || (dueInMonths === 0 && vaccineTitle.includes("الصفرية"))) {
        if (officeName === "رعاية_طفل_شبرا_ميدان_الساعة") {
            if (vaccineTitle.includes("الدرن")) return []; 
            return [0, 1, 2, 3, 4, 6]; 
        }
        if (officeName === "صحة_أول_مديرية_الصحة") return [6]; 
        return [2, 6]; 
    }
    if (officeName === "الهلال_القديم") {
        if (dueInMonths === 9) return [0, 1, 2, 3, 4, 6];
        if ([2, 4, 6].includes(dueInMonths)) return [1, 3, 6];
        if ([12, 18].includes(dueInMonths)) return [0, 2, 4];
    }
    if (officeName === "صحة_أول_مديرية_الصحة") {
        if ([12, 18].includes(dueInMonths)) return [6];
        return [2, 4, 6];
    }
    if (officeName === "عمارة_برغش" || officeName === "رعاية_طفل_شبرا_ميدان_الساعة") {
        return [0, 1, 2, 3, 4, 6];
    }
    return [2, 6]; 
};

// 1. لوحة التحكم المجمعة (Unified Dashboard)
export const getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = req.user;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. بيانات المستخدم
        const userData = {
            name: user.name,
            role: "ولي أمر", // يمكن تعديلها لاحقاً
        };

        // 2. التنبيهات النشطة
        const announcements = await announcementModel.find({
            isActive: true,
            startDate: { $lte: today },
            endDate: { $gte: today }
        }).sort({ createdAt: -1 });

        // 3. معالجة بيانات الأطفال والتطعيمات
        const children = await childModel.find({ parent: userId });
        const childIds = children.map(child => child._id);
        const allSchedules = await VaccineScheduleModel.find().sort({ dueInMonths: 1 }).populate('vaccine');

        let overdue = [];
        let upcoming = [];
        let nextVaccineTask = null;
        let childrenData = []; // To store detailed child info with advice

        const adviceMilestones = [18, 12, 9, 6, 4, 2, 0]; // Descending order for finding current stage

        for (const child of children) {
            // Calculate Age
            const birthDate = new Date(child.birthDate);
            const ageInMilliseconds = today - birthDate;
            const ageInMonths = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24 * 30.44));
            
            // Get Current Advice (based on most recent milestone passed)
            const currentMilestone = adviceMilestones.find(m => ageInMonths >= m) || 0;
            const adviceData = getVaccineAdvice(currentMilestone);

            // Get Additional Medical Tips (from Information Model)
            const medicalTips = await informationModel.find({
                isActive: true,
                minAgeMonths: { $lte: ageInMonths },
                maxAgeMonths: { $gte: ageInMonths }
            }).sort({ minAgeMonths: -1 });

            childrenData.push({
                id: child._id,
                name: child.name,
                ageInMonths: ageInMonths,
                currentAdvice: {
                    milestone: currentMilestone, // Helpful to know which advice is being shown
                    medical: adviceData.medical || "",
                    nutrition: adviceData.nutrition || "",
                    tips: adviceData.tips || "",
                    documents: adviceData.documents || "",
                    important: adviceData.important || ""
                },
                medicalTips: medicalTips
            });

            const administered = await administeredVaccineModel.find({ child: child._id });
            const takenIds = administered.map(rec => rec.vaccineSchedule.toString());
            const officeName = child.healthOffice || "عمارة_برغش";

            // فحص الغدة والسمع
            const ghoddaBaseDate = new Date(child.birthDate);
            ghoddaBaseDate.setDate(ghoddaBaseDate.getDate() + 3);
            const allowedForGhodda = (officeName === "صحة_أول_مديرية_الصحة") ? [6] : [2, 6];
            const ghoddaDate = getNextWorkingDay(ghoddaBaseDate, allowedForGhodda);

            if (ghoddaDate >= today) {
                const ghoddaAdvice = getVaccineAdvice(0);
                const task = {
                    childName: child.name,
                    title: "تحليل الغدة الدرقية واختبار السمع",
                    expectedDate: formatDateManual(ghoddaDate),
                    dayName: daysArabic[ghoddaDate.getDay()],
                    advice: "بعد 72 ساعة من الولادة (سبت وثلاثاء فقط). " + (ghoddaAdvice.medical || ""),
                    type: "upcoming"
                };
                if (!nextVaccineTask || new Date(task.expectedDate) < new Date(nextVaccineTask.expectedDate)) {
                    nextVaccineTask = task;
                }
                upcoming.push(task);
            }

            // فحص باقي التطعيمات
            for (const schedule of allSchedules) {
                const isTaken = takenIds.includes(schedule._id.toString());
                if (isTaken) continue;

                let finalDate;
                if (schedule.dueInMonths === 0 && schedule.title.includes("التهاب الكبد")) {
                    finalDate = new Date(child.birthDate);
                } 
                else if (schedule.dueInMonths === 0 && (schedule.title.includes("الدرن") || schedule.title.includes("الصفرية"))) {
                    const allowed = getAllowedDays(officeName, schedule.title, schedule.dueInMonths);
                    finalDate = (schedule.title.includes("الدرن") && officeName === "رعاية_طفل_شبرا_ميدان_الساعة") 
                                ? null : ghoddaDate;
                } 
                else {
                    let baseDate = new Date(child.birthDate.getFullYear(), child.birthDate.getMonth() + schedule.dueInMonths, child.birthDate.getDate());
                    const allowed = getAllowedDays(officeName, schedule.title, schedule.dueInMonths);
                    finalDate = getNextWorkingDay(baseDate, allowed);
                }

                if (!finalDate) continue; // تخطي إذا لم يكن هناك تاريخ (مثل الدرن في شبرا)

                const scheduleAdvice = getVaccineAdvice(schedule.dueInMonths);
                const item = {
                    childName: child.name,
                    ...schedule._doc,
                    expectedDate: formatDateManual(finalDate),
                    dayName: daysArabic[finalDate.getDay()],
                    advice: scheduleAdvice.medical || "",
                    nutrition: scheduleAdvice.nutrition || "",
                    tips: scheduleAdvice.tips || "",
                    documents: scheduleAdvice.documents || "",
                    important: scheduleAdvice.important || ""
                };

                if (finalDate < today) {
                    overdue.push(item);
                } else {
                    upcoming.push(item);
                    if (!nextVaccineTask || finalDate < new Date(nextVaccineTask.expectedDate)) {
                        nextVaccineTask = { ...item, type: "next" };
                    }
                }
            }
        }

        // 4. إحصائيات المكاتب (Office Stats)
        const officeStatsRaw = await administeredVaccineModel.aggregate([
            { $match: { child: { $in: childIds } } },
            {
                $group: {
                    _id: "$office",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const officeStats = officeStatsRaw.map(s => ({
            office: s._id || "غير محدد",
            count: s.count
        }));

        // 5. آخر النشاطات (Recent Activity)
        const recentRaw = await administeredVaccineModel.find({ child: { $in: childIds } })
            .sort({ administeredDate: -1 })
            .limit(10)
            .populate('child', 'name')
            .populate('vaccineSchedule', 'title');
        
        const recentActivity = recentRaw.map(r => ({
            childName: r.child?.name || "غير معروف",
            vaccine: r.vaccineSchedule?.title || "غير معروف",
            date: r.administeredDate.toISOString().split('T')[0],
            office: r.office || "غير محدد"
        }));

        res.status(200).json({
            message: "Success",
            user: userData,
            stats: {
                childrenCount: children.length,
                overdueCount: overdue.length,
                upcomingCount: upcoming.length
            },
            children: childrenData, // Added detailed children info with advice
            nextVaccine: nextVaccineTask,
            announcements: announcements,
            schedule: {
                overdue: overdue,
                upcoming: upcoming
            },
            officeStats: officeStats,
            recentActivity: recentActivity
        });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};
