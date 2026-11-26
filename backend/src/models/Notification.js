import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "ticket_created",
        "ticket_assigned",
        "new_message",
        "status_changed",
        "ticket_resolved",
        "sla_warning",
        "sla_breached",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    body: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    resourceType: {
      type: String,
      enum: ["ticket", "message"],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);

export default Notification;
