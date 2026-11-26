import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .pipe(z.email().max(254))
  .transform((email) => email.toLowerCase());
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "Password must be no more than 72 UTF-8 bytes.",
  );
const existingPasswordSchema = z
  .string()
  .min(1)
  .refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "Password must be no more than 72 UTF-8 bytes.",
  );

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: existingPasswordSchema,
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    token: z.string().regex(/^[a-f0-9]{64}$/i),
    password: passwordSchema,
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: existingPasswordSchema,
    newPassword: passwordSchema,
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current password.",
  });

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
  })
  .strict();
