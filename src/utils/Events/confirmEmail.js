// import {EventEmitter} from 'events';
// import { confirmation } from '../../service/confirmation.js';

// export const eventEmitter = new EventEmitter();


// eventEmitter.on("confirmEmail",async(data)=>{
//     const {email,otp} = data;
//     const isSend = await confirmation({to:email,html:`<h1>Your OTP is ${otp}</h1>`})
//     if(!isSend){
//         throw new Error("Failed to send otp through email");
//     }
// })