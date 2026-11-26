import { z } from "zod";

const email = z
  .string()
  .trim()
  .pipe(z.email("Enter a valid email address.").max(254))
  .transform((value) => value.toLowerCase());
const password = z
  .string()
  .min(12, "Use at least 12 characters.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Password must be no more than 72 UTF-8 bytes.",
  );
const existingPassword = z
  .string()
  .min(1, "Enter your password.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Password must be no more than 72 UTF-8 bytes.",
  );

export const loginSchema = z.object({
  email,
  password: existingPassword,
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  password,
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
});

export const changePasswordSchema = z
  .object({
    currentPassword: existingPassword,
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one.",
  });

export const createTicketFormSchema = z.object({
  subject: z.string().trim().min(3, "Enter at least 3 characters.").max(200),
  description: z.string().trim().min(1, "Describe the issue.").max(20000),
  categoryId: z.string().regex(/^[a-f0-9]{24}$/i, "Choose a category."),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  attachments: z.unknown().optional().refine(
    (files) => {
      if (!files || files.length === 0) {
        return true;
      }
      if (typeof files.length !== "number" || files.length > 5) {
        return false;
      }
      return Array.from(files).every(
        (file) =>
          file.size > 0 &&
          file.size <= 5 * 1024 * 1024 &&
          ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
            file.type,
          ),
      );
    },
    {
      message: "Attach up to five JPEG, PNG, WebP, or PDF files (5 MB each).",
    },
  ),
});
