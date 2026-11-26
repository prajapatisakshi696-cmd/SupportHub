import nodemailer from "nodemailer";
import AppError from "../utils/AppError.js";

export function getPasswordResetEmailConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new AppError(503, "Password reset email is not configured.");
  }
  const port = Number(SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new AppError(503, "Password reset email configuration is invalid.");
  }
  return { host: SMTP_HOST, port, user: SMTP_USER, pass: SMTP_PASS, from: SMTP_FROM };
}

export async function sendPasswordResetEmail(user, token) {
  const smtp = getPasswordResetEmailConfig();
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const resetUrl = new URL("/reset-password", frontendUrl);
  resetUrl.searchParams.set("email", user.email);
  resetUrl.searchParams.set("token", token);

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({
    from: smtp.from,
    to: user.email,
    subject: "Reset your SupportHub password",
    text: `Hello ${user.name},\n\nUse this link to reset your SupportHub password. It expires in 30 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
  });
}
