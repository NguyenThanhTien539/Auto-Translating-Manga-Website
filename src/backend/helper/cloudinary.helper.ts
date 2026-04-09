import cloudinary from "cloudinary";
import CloudinaryStorage from "multer-storage-cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

export const storage = new CloudinaryStorage({
  // multer-storage-cloudinary expects the cloudinary module object
  // so it can call cloudinary.v2.uploader internally.
  cloudinary,
});
