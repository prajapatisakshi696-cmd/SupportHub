import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../utils/AppError.js";
import { validateAttachmentFile } from "../utils/validateAttachment.js";

test("validates attachment content signatures and sanitizes displayed filenames", () => {
  const attachment = validateAttachmentFile({
    buffer: Buffer.from("%PDF-1.7\n"),
    mimetype: "application/pdf",
    originalname: "..\\private\\invoice.pdf",
    size: 10,
  });

  assert.equal(attachment.fileName, "invoice.pdf");
  assert.equal(attachment.format, "pdf");
  assert.equal(attachment.contentType, "application/pdf");
});

test("accepts supported image signatures", () => {
  const files = [
    {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
      mimetype: "image/jpeg",
      originalname: "photo.jpg",
      size: 4,
      format: "jpg",
    },
    {
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      mimetype: "image/png",
      originalname: "photo.png",
      size: 8,
      format: "png",
    },
    {
      buffer: Buffer.from("RIFFxxxxWEBP"),
      mimetype: "image/webp",
      originalname: "photo.webp",
      size: 12,
      format: "webp",
    },
  ];

  for (const file of files) {
    assert.equal(validateAttachmentFile(file).format, file.format);
  }
});

test("rejects mismatched attachment types and attachments above the size limit", () => {
  assert.throws(
    () =>
      validateAttachmentFile({
        buffer: Buffer.from("%PDF-1.7\n"),
        mimetype: "image/png",
        originalname: "image.png",
        size: 10,
      }),
    AppError,
  );
  assert.throws(
    () =>
      validateAttachmentFile({
        buffer: Buffer.from("%PDF-1.7\n"),
        mimetype: "application/pdf",
        originalname: "large.pdf",
        size: 5 * 1024 * 1024 + 1,
      }),
    AppError,
  );
});
