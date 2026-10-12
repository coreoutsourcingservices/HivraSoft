require("dotenv").config({ quiet: true });
const transporter = require("../dist/config/mail").default;
console.log({ host: process.env.SMTP_HOST || "smtp.gmail.com", port: process.env.SMTP_PORT || 587,
  userConfigured: !!process.env.SMTP_USER, passwordConfigured: !!process.env.SMTP_PASS });
transporter.verify().then(() => console.log("SMTP connection and authentication OK"))
  .catch(error => { console.error("SMTP verification failed:", error.code, error.command); process.exitCode = 1; })
  .finally(() => transporter.close());
