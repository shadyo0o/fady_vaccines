
import { Router } from "express";
import * as infoService from "./information.service.js";
import { validation } from "../../middlewares/validation.js";
import * as infoVal from "./information.validation.js";

const infoRouter = Router();

// --- جلب كل النصائح الطبية (مع دعم الفلترة حسب السن أو التصنيف) ---
infoRouter.get("/",
    validation(infoVal.getInfoSchema),
    infoService.getAllInfo
);

export default infoRouter;