// import admin from 'firebase-admin';
// import { readFileSync } from 'fs';
// import { join, dirname } from 'path';
// import { fileURLToPath } from 'url';

// // 1. تحديد مسار المجلد الحالي (لأننا نستخدم ES Modules)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const initializeFirebase = () => {
//     if (admin.apps.length > 0) return admin.app();
//     try {
//         // 2. تحديد مسار ملف الـ JSON الذي رفعته (firebase-key.json)
//         // المسار: نعود خطوتين للخلف للوصول لمجلد config ثم الملف
//         const serviceAccountPath = join(__dirname, '../../../config/firebase-key.json');
        
//         // 3. قراءة وتحويل الملف إلى JSON
//         const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

//         console.log("✅ Firebase initialized successfully using local JSON file.");
//         return admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount)
//         });

//     } catch (error) {
//         console.error("❌ Firebase Init Error (Local File):", error.message);
//         return null;
//     }
// };
// const firebaseAdmin = initializeFirebase();
// export default firebaseAdmin;




// import admin from 'firebase-admin';

// const initializeFirebase = () => {
//     if (admin.apps.length > 0) return admin.app();

//     try {
//         let serviceAccount;

//         // 1. التحقق أولاً من وجود متغير بيئي (للسيرفر مثل Koyeb)
//         if (process.env.FIREBASE_CONFIG) {
//             serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
//             console.log("✅ Firebase initialized using Environment Variable.");
//         } 
//         // 2. إذا لم يوجد، يبحث عن الملف المحلي (لجهازك الشخصي)
//         else {
//             // ملاحظة: تأكد من أن المسار صحيح بالنسبة لمكان هذا الملف
//             serviceAccount = './config/firebase-key.json'; 
//             console.log("🏠 Firebase initialized using local JSON file.");
//         }

//         return admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount)
//         });
//     } catch (error) {
//         console.error("❌ Firebase Init Error:", error.message);
//         return null;
//     }
// };

// const firebaseAdmin = initializeFirebase();
// export default firebaseAdmin;



// import admin from 'firebase-admin';

// const initializeFirebase = () => {
//     if (admin.apps.length > 0) return admin.app();

//     try {
//         let serviceAccount;
//         // القراءة من المتغير البيئي الذي وضعناه في Koyeb
//         if (process.env.FIREBASE_CONFIG) {
//             serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
//         } else {
//             // هذا للمكان المحلي فقط
//             serviceAccount = './config/firebase-key.json'; 
//         }

//         return admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount)
//         });
//     } catch (error) {
//         console.error("Firebase Init Error:", error.message);
//         return null;
//     }
// };

// const firebaseAdmin = initializeFirebase();
// export default firebaseAdmin;





import admin from 'firebase-admin';

const initializeFirebase = () => {
    if (admin.apps.length > 0) return admin.app();

    try {
        let serviceAccount;
        // التحقق إذا كنا على السيرفر (Railway)
        if (process.env.FIREBASE_CONFIG) {
            serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
        } else {
            // التحقق محلياً على جهازك
            serviceAccount = './config/firebase-key.json'; 
        }

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("❌ Firebase Init Error:", error.message);
        return null;
    }
};

const firebaseAdmin = initializeFirebase();
export default firebaseAdmin;