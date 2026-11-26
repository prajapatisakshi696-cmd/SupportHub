import { v2 as cloudinary } from "cloudinary";
import AppError from "../utils/AppError.js";

const credentials = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

const isConfigured = Object.values(credentials).every(Boolean);

if (isConfigured) {
  cloudinary.config({ ...credentials, secure: true });
}

export function getCloudinaryClient() {
  if (!isConfigured) {
    throw new AppError(
      503,
      "File uploads are unavailable until Cloudinary is configured.",
    );
  }
  return cloudinary;
}
