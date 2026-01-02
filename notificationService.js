import admin from './firebaseConfig.js'; 

export const sendNotification = async (token, title, body, data = {}) => {
    const message = {
        notification: { title, body },
        token: token,
        data: data
    };
    try {
        // التأكد من أن الإعدادات جاهزة قبل الإرسال
        if (!admin) throw new Error("Firebase Admin not initialized");
        
        const response = await admin.messaging().send(message);
        console.log("Notification sent successfully:", response);
        return response;
    } catch (error) {
        console.error("Error sending notification:", error);
        return null;
    }
};