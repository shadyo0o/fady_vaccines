import mongoose from "mongoose"


export const connectionDB =async () => {
    await mongoose.connect(process.env.URL).then(()=>{
        console.log("Data base connected")
    }).catch((err)=>{
        console.log("Error in DB connection", err)
    })
}