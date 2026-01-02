import { roleType } from "../DB/models/User/User.model.js";



export const authorization=(roles=[Object.values(roleType)])=>(req,res,next)=>{
    if(!roles.includes(req.user.role)){
        return res.status(403).json({message:"You are not allowed to access this resource"})
    }
    next();
}