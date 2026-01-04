import admin from 'firebase-admin';

const initializeFirebase = () => {
    // إذا تم تفعيل التطبيق مسبقاً لا تفعل شيئاً
    if (admin.apps.length > 0) return admin.app();

    try {
        let serviceAccount;

        // التحقق من وجود المتغير البيئي في Railway أولاً
        if (process.env.FIREBASE_CONFIG) {
            // تحويل النص المخزن في Railway إلى Object
            serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
            console.log("✅ Firebase Config found in Environment Variables");
        } else {
            // هذا الجزء سيفشل على السيرفر لكنه يعمل على جهازك
            throw new Error("FIREBASE_CONFIG variable is missing!");
        }

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("❌ Firebase Initialization Error:", error.message);
        return null;
    }
};

const firebaseAdmin = initializeFirebase();
export default firebaseAdmin;