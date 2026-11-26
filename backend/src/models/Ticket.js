import mongoose from "mongoose";
import attachmentSchema from "./schemas/attachment.schema.js";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { _id: false },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^SUP-\d{5,}$/,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 20000,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    slaDeadline: {
      type: Date,
    },
    slaWarningSentAt: {
      type: Date,
    },
    slaBreachSentAt: {
      type: Date,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: "open" }],
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

ticketSchema.index({ customer: 1, createdAt: -1 });
ticketSchema.index({ assignedAgent: 1, status: 1, updatedAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ status: 1, slaDeadline: 1 });

const Ticket = mongoose.models.Ticket ?? mongoose.model("Ticket", ticketSchema);

export default Ticket;
