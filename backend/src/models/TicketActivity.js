import mongoose from "mongoose";

const ticketActivitySchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      enum: [
        "ticket_created",
        "assigned",
        "reassigned",
        "status_changed",
        "priority_changed",
        "message_added",
        "internal_note_added",
        "attachment_added",
        "reopened",
        "closed",
      ],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

ticketActivitySchema.index({ ticket: 1, createdAt: -1 });
ticketActivitySchema.index({ actor: 1, createdAt: -1 });

const TicketActivity =
  mongoose.models.TicketActivity ??
  mongoose.model("TicketActivity", ticketActivitySchema);

export default TicketActivity;
