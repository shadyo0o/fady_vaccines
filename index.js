import dotenv from "dotenv";
dotenv.config({});

import './src/utils/cron/vaccineReminder.js';

import express from 'express'
import bootstrap from './src/app.controller.js'

const app = express()
const port = process.env.PORT || 5000

bootstrap(app, express)

// مسار تجريبي للتأكد من حالة السيرفر وقاعدة البيانات
app.get('/status', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({
      server: 'Running',
      database: dbStatus,
      firebase: admin ? 'Initialized' : 'Failed',
      message: 'Vaccination App API is Live!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))