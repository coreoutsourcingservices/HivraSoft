import nodemailer from "nodemailer";

const transporter =
  nodemailer.createTransport({
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    host:
      process.env.SMTP_HOST ||
      "smtp.gmail.com",

    port: Number(
      process.env.SMTP_PORT || 587
    ),

    secure:
      process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : Number(process.env.SMTP_PORT || 587) === 465,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export default transporter;
