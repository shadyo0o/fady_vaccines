import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 1. تحديد مسار المجلد الحالي (لأننا نستخدم ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initializeFirebase = () => {
    if (admin.apps.length > 0) return admin.app();

    try {
        // 2. تحديد مسار ملف الـ JSON الذي رفعته (firebase-key.json)
        // المسار: نعود خطوتين للخلف للوصول لمجلد config ثم الملف
        const serviceAccountPath = join(__dirname, '../../../config/firebase-key.json');
        
        // 3. قراءة وتحويل الملف إلى JSON
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        console.log("✅ Firebase initialized successfully using local JSON file.");
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

    } catch (error) {
        console.error("❌ Firebase Init Error (Local File):", error.message);
        return null;
    }
};

const firebaseAdmin = initializeFirebase();

export default firebaseAdmin;