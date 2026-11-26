import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "agent", "customer"],
      default: "customer",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "invited", "suspended"],
      default: "active",
      required: true,
    },
    avatar: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
    },
    emailVerifiedAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    lastSeenAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, status: 1 });

const User = mongoose.models.User ?? mongoose.model("User", userSchema);

export default User;
