import mongoose from "mongoose";
import attachmentSchema from "./schemas/attachment.schema.js";

const readReceiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    isInternal: {
      type: Boolean,
      default: false,
      required: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    readAt: {
      type: Date,
    },
    readReceipts: {
      type: [readReceiptSchema],
      default: [],
    },
  },
  { timestamps: true },
);

messageSchema.index({ ticket: 1, createdAt: 1 });

const Message = mongoose.models.Message ?? mongoose.model("Message", messageSchema);

export default Message;
