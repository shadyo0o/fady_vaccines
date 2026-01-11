import { Router } from "express";
import {updateFcmToken, getProfile, loginWithGoogle, refreshToken, signIn, signUp } from "./user.service.js";
import { authentication, tokenType } from "../../middlewares/authentication.js";
import { validation } from "../../middlewares/validation.js";
import { loginWithGoogleSchema, signInSchema, signUpSchema } from "./user.validation.js";

const userRouter = Router()

userRouter.post("/signup",validation(signUpSchema),signUp)
// userRouter.post("/confirm",validation(confirmEmailSchema),confirmEmail)
userRouter.post("/signin",validation(signInSchema),signIn)
userRouter.get('/profile', authentication(),getProfile)
userRouter.get('/refreshToken',authentication(tokenType.refresh),refreshToken)
userRouter.post('/loginWithGoogle',validation(loginWithGoogleSchema),loginWithGoogle);

userRouter.patch("/fcm-token", authentication(),updateFcmToken);

// في ملف user.router.js أو notifications.router.js
import { sendNotification } from '../../utils/firebase/notificationService.js';

userRouter.post("/test-notification", async (req, res) => {
    const { token } = req.body; // التوكن الذي سنحصل عليه من Firebase
    
    try {
        await sendNotification(
            token, 
            "رسالة تجريبية من السيرفر", 
            "تطبيق Vaccination and Birth Path يعمل بنجاح!"
        );
        res.status(200).json({ message: "Notification sent successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



export default userRouter;