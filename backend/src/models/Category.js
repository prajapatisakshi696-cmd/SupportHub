import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isInteger,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });

const Category = mongoose.models.Category ?? mongoose.model("Category", categorySchema);

export default Category;
