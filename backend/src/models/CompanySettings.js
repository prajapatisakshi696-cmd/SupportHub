import mongoose from "mongoose";

const companySettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "default",
      immutable: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    timezone: {
      type: String,
      required: true,
      default: "UTC",
      trim: true,
    },
    slaHours: {
      low: { type: Number, default: 72, min: 1 },
      medium: { type: Number, default: 24, min: 1 },
      high: { type: Number, default: 8, min: 1 },
      urgent: { type: Number, default: 2, min: 1 },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const CompanySettings =
  mongoose.models.CompanySettings ??
  mongoose.model("CompanySettings", companySettingsSchema);

export default CompanySettings;
