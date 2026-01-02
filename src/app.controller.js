


import { connectionDB } from "./DB/connectionDB.js"
import cors from 'cors'
import helmet from 'helmet'        // إضافة helmet للحماية
import morgan from 'morgan'        // إضافة morgan للمراقبة
import rateLimit from 'express-rate-limit' // إضافة تحديد الطلبات
import userRouter from "./modules/user/user.controller.js"
import childRouter from "./modules/child/child.controller.js"
import { seedDatabase } from "../seeder.js"
import infoRouter from "./modules/information/information.controller.js";

// إعداد حارس البوابة (Rate Limiter)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // حد أقصى 100 طلب من كل IP
    message: { message: "طلبات كثيرة جداً، يرجى المحاولة لاحقاً" }
});

const bootstrap = async (app, express) => {
    // 1. حماية الـ HTTP Headers (توضع في البداية)
    app.use(helmet());

    // 2. مراقبة الطلبات في الـ Terminal (تظهر لك الـ Status Code والوقت)
    app.use(morgan('dev'));

    // 3. تحويل البيانات لـ JSON (موجودة عندك بالفعل)
    app.use(express.json());

    // 4. السماح بالوصول من المتصفح/التطبيق (موجودة عندك بالفعل)
    app.use(cors());

    // 5. تطبيق محدد الطلبات
    app.use(limiter);

    // قاعدة البيانات والجداول (موجودة عندك بالفعل)
    // await seedDatabase();
    await connectionDB();

    // الراوتس (Routes)
    app.use("/users", userRouter);
    app.use("/childs", childRouter);
     app.use("/information", infoRouter);

    app.get('/', (req, res) => res.json({ message: 'Fady Vaccines API is running...' }));

// إضافة اسم للمعامل ليفهمه المتصفح
app.use((req, res, next) => {
    res.status(404).json({ message: "API endpoint not found" });
});
}

export default bootstrap;