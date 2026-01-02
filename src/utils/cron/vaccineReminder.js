


import cron from 'node-cron';
import childModel from '../../DB/models/Child/Child.js';
import { sendNotification } from '../firebase/notificationService.js';
import { calculateChildVaccines } from '../vaccineCalculations.js';

// الفحص يتم يومياً الساعة 9 صباحاً
cron.schedule('0 9 * * *', async () => {
    console.log('--- Starting Daily Vaccine Check ---');
    
    try {
        const children = await childModel.find().populate('parent');
        
        // تواريخ المقارنة
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const afterTomorrow = new Date();
        afterTomorrow.setDate(today.getDate() + 2);

        // تحويل التواريخ لنصوص للمقارنة (YYYY-MM-DD)
        const dateStrings = {
            today: today.toISOString().split('T')[0],
            tomorrow: tomorrow.toISOString().split('T')[0],
            afterTomorrow: afterTomorrow.toISOString().split('T')[0]
        };

        for (const child of children) {
            if (!child.parent || !child.parent.fcmToken) continue;

            const schedule = await calculateChildVaccines(child.birthDate);
            
            for (const item of schedule) {
                let messageTitle = "";
                let messageBody = "";

                // 1. تنبيه قبل الموعد بـ 48 ساعة
                if (item.expectedDate === dateStrings.afterTomorrow) {
                    messageTitle = `تذكير هام لـ ${child.name}`;
                    messageBody = `بعد غد موعد تطعيم: ${item.doseTitle}. يرجى التجهيز للذهاب.`;
                }
                
                // 2. تنبيه قبل الموعد بـ 24 ساعة
                else if (item.expectedDate === dateStrings.tomorrow) {
                    messageTitle = `تنبيه: موعد تطعيم غداً`;
                    messageBody = `غداً إن شاء الله موعد جرعة ${item.doseTitle} لـ ${child.name}.`;
                }

                // 3. تنبيه يوم التطعيم
                else if (item.expectedDate === dateStrings.today) {
                    messageTitle = `اليوم هو موعد التطعيم!`;
                    messageBody = `موعد تطعيم ${child.name} (${item.doseTitle}) اليوم. لا تنسي التوجه للمركز الطبي.`;
                }

                // إرسال الإشعار إذا تحقق أي شرط
                if (messageTitle) {
                    await sendNotification(child.parent.fcmToken, messageTitle, messageBody, {
                        childId: child._id.toString(),
                        vaccineTitle: item.doseTitle
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in Vaccine Reminder Cron:', error);
    }
});