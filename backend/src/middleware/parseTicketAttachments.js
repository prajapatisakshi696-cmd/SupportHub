import multer from "multer";
import AppError from "../utils/AppError.js";
import {
  MAX_ATTACHMENT_SIZE,
  MAX_TICKET_ATTACHMENTS,
} from "../utils/validateAttachment.js";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ATTACHMENT_SIZE,
    files: MAX_TICKET_ATTACHMENTS,
  },
  fileFilter(_request, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      callback(
        new AppError(
          400,
          "Attachments must be JPEG, PNG, WebP, or PDF files.",
        ),
      );
      return;
    }
    callback(null, true);
  },
});

export default function parseTicketAttachments(request, _response, next) {
  upload.array("attachments", MAX_TICKET_ATTACHMENTS)(
    request,
    _response,
    (error) => {
      if (error instanceof multer.MulterError) {
        const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        next(
          new AppError(
            statusCode,
            error.code === "LIMIT_FILE_SIZE"
              ? "Each attachment must be no larger than 5 MB."
              : "You can attach up to five files to a ticket.",
          ),
        );
        return;
      }
      if (error) {
        next(error);
        return;
      }
      request.files ??= [];
      next();
    },
  );
}
