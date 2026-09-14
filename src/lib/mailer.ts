import nodemailer from 'nodemailer';

export const sendMail = async ({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  // If no mail config is set, skip to prevent crashes in dev
  if (!process.env.MAIL_HOST) {
    console.warn(`[MAILER MOCK] Sending email to: ${to} | Subject: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_PORT === '465',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html
    });
    console.log(`[MAILER] Sent email to ${to} successfully.`);
  } catch (error) {
    console.error(`[MAILER ERROR] Failed to send email to ${to}:`, error);
  }
};
