const nodemailer = require("nodemailer");
const config = require("../config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL,
    pass: config.PASSWORD,
  },
});

exports.sendMail = async (receiverEmail, subject, body) => {
  if (!config.EMAIL || !config.PASSWORD) {
    console.log("sendMail skipped: EMAIL or PASSWORD not configured");
    return;
  }
  try {
    await transporter.sendMail({
      from: config.EMAIL,
      to: receiverEmail,
      subject,
      html: body,
    });
  } catch (error) {
    console.log("sendMail failed:", error.message);
  }
};
