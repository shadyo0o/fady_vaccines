

import { Router } from "express";
import * as childService from "./child.service.js";
import { authentication } from "../../middlewares/authentication.js";
import { validation } from "../../middlewares/validation.js";
import * as childVal from "./child.validation.js";

const childRouter = Router();

// إضافة طفل
childRouter.post("/addChild",authentication(),validation(childVal.addChildSchema),childService.addChild);

// تحميل بيانات الطفل
childRouter.get("/getall",authentication(),childService.getAll);

// جلب جدول التطعيمات
childRouter.get("/getDueVaccines/:id",authentication(),validation(childVal.getChildByIdSchema),childService.getDueVaccines);

// تسجيل تطعيم
childRouter.post("/recordVaccine",authentication(),validation(childVal.recordVaccineSchema),childService.recordVaccine);

// إنشاء تنبيه (للمسؤولين مثلاً)
childRouter.post("/createAnnouncement",validation(childVal.createAnnouncementSchema),childService.createAnnouncement);

// جلب السجل التاريخي
childRouter.get("/getVaccineHistory/:id",authentication(),validation(childVal.getChildByIdSchema),childService.getVaccineHistory);

// جلب موعد التطعيم القادم
childRouter.get("/getNextVaccine/:id", authentication(), validation(childVal.getChildByIdSchema), childService.getNextVaccineDate);


// جلب التنبيهات النشطة
childRouter.get("/announcements", childService.getActiveAnnouncements);

// جلب النصائح المجمعة للطفل
childRouter.get("/getAdvice/:id", authentication(), validation(childVal.getChildByIdSchema), childService.getChildAdvice);

export default childRouter;
