import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import  userModel, { providerEnum }  from '../../DB/models/User/User.model.js';
import { randomUUID } from 'crypto';
import { eventEmitter } from '../../utils/Events/confirmEmail.js';
import { OAuth2Client } from 'google-auth-library';
export const signUp = async (req, res) => {
    // Your sign-up logic here
    const {name,password,email,phone,gender}=req.body;

    if(await userModel.findOne({email})){
        return res.status(400).json({message:"Email already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
    const otp = randomUUID()
    const hashOtp=await bcrypt.hash(otp,Number(process.env.SALT_ROUNDS));
    eventEmitter.emit("confirmEmail",{email:email,otp:otp});
    const user = await userModel.create({name,password:hashedPassword,otp:hashOtp,email,phone,gender});
    res.status(201).json({ message: "User created successfully and otp sent successfully go to confirm email" });
}

export const confirmEmail = async (req, res) => {
    const {email,otp}=req.body;
    const user = await userModel.findOne({email,otp:{$exists:true},confirmed:false});
    if(!user || ! await bcrypt.compare(otp ,user.otp )){
        return res.status(400).json({message:"Invalid email or otp"});
    }
    const updated = await userModel.findOneAndUpdate({email},
        {$unset:{otp:""} , confirmed:true}, { new: true, select: '-password -otp' }
    )
    res.status(200).json({message : `email confirmed successfully` , user: updated  })
}

export const signIn = async (req, res) => {
    // Your sign-in logic here
    const {email,password}=req.body;
    const user = await userModel.findOne({email,confirmed:true,provider:providerEnum.system});
    if(!user || ! await bcrypt.compareSync(password ,user.password )){
        return res.status(401).json({message:"Invalid credentials"});
    }
    const token = jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET);
         const refreshToken = jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET_REFRESH,{expiresIn:"540d"});
    res.status(200).json({ message: "User signed in successfully", token , refreshToken });
    
}

export const getProfile = async (req, res) => {
    
    res.status(200).json({ message: "User profile fetched successfully", user:req.user });
}


export const loginWithGoogle = async (req,res,next)=>{
    const {tokenId} = req.body

const client = new OAuth2Client();
async function verify() {
  const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.WEB_CLIENT_ID,  // Specify the WEB_CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
return payload;
}

const {email_verified,email,name} = await verify()
 let user = await userModel.findOne({email,confirmed:true});
 if(!user){
    user = await userModel.create({
        name,
        email,
        confirmed:email_verified,
        provider:providerEnum.google
    });
 }
 if(user.provider != providerEnum.google){
    return res.status(400).json({message:"please login using your system account"})
 }

     const token = jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET,{expiresIn:"1h"});
    
     const refreshToken = jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET_REFRESH,{expiresIn:"540d"});
    res.status(200).json({ message: "User signed in successfully", token , refreshToken });

}


export const refreshToken = async (req,res,next)=>{
         const token = jwt.sign({id:req?.user?._id,email:req?.user?.email},process.env.JWT_SECRET,{expiresIn:"1h"});
    
     const refreshToken = jwt.sign({id:req?.user?._id,email:req?.user?.email},process.env.JWT_SECRET_REFRESH,{expiresIn:"540d"});
    res.status(200).json({ message: "User signed in successfully", token , refreshToken });
}




export const updateFcmToken = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id; // يتم جلبه من ميدل وير الـ authentication

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // تحديث التوكن للمستخدم الحالي
        await userModel.findByIdAndUpdate(userId, { fcmToken: token });

        res.status(200).json({ message: "FCM Token updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};