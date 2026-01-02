import admin from 'firebase-admin';

const initializeFirebase = () => {
  if (admin.apps.length > 0) return admin.app();

  try {
    // قراءة البيانات من Vercel
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

    // إصلاح مشكلة الأسطر في المفتاح السري
    if (firebaseConfig.private_key) {
      firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, '\n');
    }

    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
  } catch (error) {
    console.error("Firebase Init Error:", error.message);
    return null;
  }
};

const firebaseAdmin = initializeFirebase();
export default firebaseAdmin;