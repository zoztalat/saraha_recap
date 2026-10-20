import mongoose from 'mongoose'
import { DB_URI } from '../../config/config.service.js';
export const connectWithDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log(`DB Connected Successfully`);
  } catch (error) {
    console.log(`Fail To Connect WIth DB`);
  }
};
