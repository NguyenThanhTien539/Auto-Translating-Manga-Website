import nodemailer from "nodemailer";
import { SentMessageInfo } from "nodemailer";

export const sendMail = (
  email: string,
  title: string,
  content: string,
): void => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_ADDRESS,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,
    to: email,
    subject: title,
    html: content,
  };

  transporter.sendMail(
    mailOptions,
    function (error: Error | null, info: SentMessageInfo) {
      if (error) {
        console.log("Error:", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    },
  );
};
