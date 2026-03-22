import cloudinary from "cloudinary";
import CloudinaryStorage from "multer-storage-cloudinary";

const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
});
