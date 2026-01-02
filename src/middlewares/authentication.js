
import jwt from "jsonwebtoken";
import userModel from "../DB/models/User/User.model.js";

export const tokenType = {
    access : "access",
    refresh : "refresh"
}

export const authentication=(token=tokenType.access)=>{

return async(req,res,next)=>{

    const {authorization}=req.headers;
    if(!authorization){
        return res.status(401).json({message:"You are not authenticated"})
    }
    if(token === tokenType.refresh){
        try{
            const decoded = jwt.verify(authorization,process.env.JWT_SECRET_REFRESH);
            if(!decoded){
                return res.status(401).json({message:"You are not authenticated"})
            }
            const user = await userModel.findById(decoded.id);
            if(!user){
                return res.status(401).json({message:"You are not authenticated"})
            }
    
            req.user=user;
    
            next();
        }catch(err){
            return res.status(401).json({message:"You are not authenticated"})
        }
    }else{
        try{
            const decoded = jwt.verify(authorization,process.env.JWT_SECRET);
            if(!decoded){
                return res.status(401).json({message:"You are not authenticated"})
            }
            const user = await userModel.findById(decoded.id);
            if(!user){
                return res.status(401).json({message:"You are not authenticated"})
            }
    
            req.user=user;
    
            next();
        }catch(err){
            return res.status(401).json({message:"You are not authenticated"})
        }
    }

}
}