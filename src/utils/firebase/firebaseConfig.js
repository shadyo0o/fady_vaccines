


import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// تحميل ملف المفتاح الخاص (JSON)
const serviceAccount = JSON.parse(
  readFileSync(new URL('../../../config/firebase-key.json', import.meta.url), 'utf8')
  
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;