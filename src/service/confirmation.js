// import nodemailer from "nodemailer";


// export const confirmation =async ({to,html})=>{
    

// // Create a test account or replace with real credentials.
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   port: 465,
//   secure: true, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// // Wrap in an async IIFE so we can use await.

//   const info = await transporter.sendMail({
//     from: `"Care Kids" <${process.env.EMAIL}>`,
//     to:to || "shady.etra@gmail.com",
//     subject: "vaccinate",
//     text: "vaccination", // plain‑text body
//     html:html || "<b>Hello world?</b>", // HTML body
//   });

//   if(info.accepted.length > 0){
//     return true;
//   }else{
//     return false;
//   }

// }



import nodemailer from "nodemailer"; // هذا هو السطر الناقص الذي يسبب الخطأ الحالي

export const confirmation = async ({ to, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD, // تأكد من أنه App Password (16 حرف)
    },
    tls: {
      rejectUnauthorized: false 
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Care Kids" <${process.env.EMAIL}>`,
      to: to,
      subject: "Fady's Vaccines - كود التفعيل",
      text: "كود التفعيل الخاص بك هو...",
      html: html,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Nodemailer Error: ", error); 
    return false;
  }
};