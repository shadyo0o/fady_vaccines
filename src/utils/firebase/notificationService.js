import admin from './firebaseConfig.js'; // التأكد من كتابة الامتداد .js

export const sendNotification = async (token, title, body, data = {}) => {
  if (!token) {
    console.log('No FCM token provided, skipping notification.');
    return;
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: data, // يمكنك إرسال id الطفل هنا مثلاً { childId: "123" }
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};