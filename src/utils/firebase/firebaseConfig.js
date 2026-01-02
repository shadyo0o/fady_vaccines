import admin from 'firebase-admin';

const initializeFirebase = () => {
  // التأكد من عدم تهيئة التطبيق أكثر من مرة
  if (admin.apps.length > 0) return admin.app();

  try {
    // التأكد من وجود متغير البيئة في Vercel
    if (!process.env.FIREBASE_CONFIG) {
      throw new Error("Missing FIREBASE_CONFIG environment variable");
    }

    // تحويل النص إلى كائن JSON
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

    // خطوة حاسمة: إصلاح رموز السطور الجديدة (\n) ليعمل المفتاح السري أونلاين
    if (firebaseConfig.private_key) {
      firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, '\n');
    }

    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
  } catch (error) {
    console.error("Firebase Initialization Error:", error.message);
    return null;
  }
};

const firebaseAdmin = initializeFirebase();
export default firebaseAdmin;