import path from "node:path";
import AppError from "./AppError.js";

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const MAX_TICKET_ATTACHMENTS = 5;

const allowedFormats = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

function hasExpectedSignature(buffer, contentType) {
  if (contentType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (contentType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (contentType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  if (contentType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  return false;
}

export function validateAttachmentFile(file) {
  const format = allowedFormats.get(file.mimetype);
  if (
    !format ||
    !Buffer.isBuffer(file.buffer) ||
    file.size < 1 ||
    file.size > MAX_ATTACHMENT_SIZE ||
    !hasExpectedSignature(file.buffer, file.mimetype)
  ) {
    throw new AppError(
      400,
      "Attachments must be valid JPEG, PNG, WebP, or PDF files no larger than 5 MB.",
    );
  }

  const fileName = path
    .basename(file.originalname.replace(/\\/g, "/"))
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 255);

  return {
    contentType: file.mimetype,
    fileName: fileName || `attachment.${format}`,
    format,
    sizeInBytes: file.size,
  };
}
