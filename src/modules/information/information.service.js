// src/modules/information/information.service.js
import informationModel from "../../DB/models/Information/Information.js";

export const getAllInfo = async (req, res) => {
  try {
    const { category, ageInMonths } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;

    // منطق فلترة النصائح حسب السن
    if (ageInMonths) {
      const age = parseInt(ageInMonths);
      query.$and = [
        { $or: [{ minAgeMonths: { $lte: age } }, { minAgeMonths: { $exists: false } }] },
        { $or: [{ maxAgeMonths: { $gte: age } }, { maxAgeMonths: { $exists: false } }] }
      ];
    }

    const data = await informationModel.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ message: "Success", data });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching data", error: error.message });
  }
};