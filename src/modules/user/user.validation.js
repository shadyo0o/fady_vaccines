import Joi from "joi";
import { genderEnum } from "../../DB/models/User/User.model.js";


export const signUpSchema = {
    body:Joi.object({
        name: Joi.string().min(2).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(3).required(),
        cPassword: Joi.string().valid(Joi.ref('password')).required().messages({'any.only':'confirm password must match password'}),
        phone: Joi.string().regex(/^01[0125][0-9]{8}$/).required(),
        gender: Joi.string().valid(genderEnum.male,genderEnum.female).required()
    
    })
}
export const confirmEmailSchema = {
    body:Joi.object({
        otp: Joi.string().required(),
        email: Joi.string().email().required(),
    })
}

export const signInSchema = {
    body:Joi.object({
        
        email: Joi.string().email().required(),
        password: Joi.string().min(3).required(),
    
    })
}
export const loginWithGoogleSchema = {
    body:Joi.object({
        tokenId: Joi.string().required(),
    })
}