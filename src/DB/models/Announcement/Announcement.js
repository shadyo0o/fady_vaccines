import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true }, 
    content: { type: String, required: true }, 
    type: { 
        type: String, 
        enum: ['campaign', 'info', 'warning'], 
        default: 'info' 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }, 
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const announcementModel =mongoose.models.Announcement ||mongoose.model("Announcement", announcementSchema);
export default announcementModel;