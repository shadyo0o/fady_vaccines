import Joi from "joi";
import { officeEnum } from "../../DB/models/Child/Child.js";
import { genderEnum } from "../../DB/models/User/User.model.js";

// قاعدة التحقق من الـ ID الخاص بـ MongoDB
const objectIdRule = Joi.string().hex().length(24);

export const addChildSchema = {
    body: Joi.object({
        name: Joi.string().min(2).max(50).required().messages({
            'string.empty': 'اسم الطفل مطلوب',
            'string.min': 'الاسم يجب ألا يقل عن حرفين'
        }),
        birthDate: Joi.date().less('now').required().messages({
            'date.less': 'تاريخ الميلاد يجب أن يكون في الماضي'
        }),
        healthOffice: Joi.string().valid(...Object.values(officeEnum)).optional(),
        gender: Joi.string().valid(...Object.values(genderEnum)).required()
    })
};



export const getChildByIdSchema = {
    params: Joi.object({
        id: objectIdRule.required()
    }),
    query: Joi.object({
        office: Joi.string().valid(...Object.values(officeEnum)).optional()
    })
};

// src/modules/child/child.validation.js
export const recordVaccineSchema = {
    body: Joi.object({
        childId: objectIdRule.required().messages({
            'string.length': 'معرف الطفل غير صحيح'
        }),
        scheduleId: objectIdRule.required().messages({
            'string.length': 'معرف التطعيم غير صحيح'
        }),
        actualDate: Joi.date().less('now').optional().messages({
            'date.less': 'تاريخ التطعيم لا يمكن أن يكون في المستقبل'
        }),
        // التأكد من أن المكتب المسجل فيه التطعيم هو أحد المكاتب المعتمدة لدينا
        office: Joi.string().valid(...Object.values(officeEnum)).optional(),
        notes: Joi.string().max(500).optional(),
    }).required()
};

export const createAnnouncementSchema = {
    body: Joi.object({
        title: Joi.string().required(),
        content: Joi.string().required(),
        type: Joi.string().valid('info', 'campaign', 'warning').default('info'),
        startDate: Joi.date().required(),
        endDate: Joi.date().greater(Joi.ref('startDate')).required()
    })
};