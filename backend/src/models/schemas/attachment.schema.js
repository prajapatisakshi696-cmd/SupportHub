import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    format: {
      type: String,
      enum: ["jpg", "png", "webp", "pdf"],
      required: true,
    },
    sizeInBytes: {
      type: Number,
      required: true,
      min: 1,
    },
  },
);

export default attachmentSchema;
