import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendMail = async (
  email: string,
  title: string,
  content: string,
): Promise<void> => {
  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,
    to: email,
    subject: title,
    html: content,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent:", info.response);
};
