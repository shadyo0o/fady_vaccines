
import joi from 'joi';

export const getInfoSchema = {
    query: joi.object({
        category: joi.string().optional(),
        ageInMonths: joi.number().min(0).max(216).optional()
    })
};