

// seeder.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { vaccinesData, medicalAdvices } from './seedData.js';
import vaccineModel from './src/DB/models/Vaccine/Vaccine.js';
import VaccineScheduleModel from './src/DB/models/VaccineSchedule/VaccineSchedule.js';
import informationModel from './src/DB/models/Information/Information.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.URL);
    console.log('🚀 Connected to MongoDB... Starting Seed');

    await vaccineModel.deleteMany({});
    await VaccineScheduleModel.deleteMany({});
    await informationModel.deleteMany({});
    console.log('🧹 Old records cleared.');

    for (const vaccineInfo of vaccinesData) {
      const newVaccine = await vaccineModel.create({
        name: vaccineInfo.name,
        description: vaccineInfo.description,
      });

      const schedulesToInsert = vaccineInfo.doses.map(dose => ({
        vaccine: newVaccine._id,
        title: dose.title, 
        doseNumber: dose.doseNumber, 
        dueInMonths: dose.dueInMonths,
      }));

      await VaccineScheduleModel.insertMany(schedulesToInsert);
    }

    await informationModel.insertMany(medicalAdvices);
    console.log('✅ Database seeded successfully!');
    
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed.');
  }
};