import transporter from "../../config/mailConfig.js";
import emailTemplates from "./templates/index.js";

export const sendEmail = async (emailType, data, to) => {
  try {
    const selectedEmailTemplateFn = emailTemplates[emailType];

    if (!selectedEmailTemplateFn) {
      throw new Error(`No email template found for type: ${emailType}`);
    }

    const { subject, html, bcc } = selectedEmailTemplateFn(data);

    const emailOptions = {
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
      ...(bcc && { bcc }),
    };

    const emailInfo = await transporter.sendMail(emailOptions);

    console.log("Message sent:", emailInfo.messageId);
    console.log(`✅ ${emailType} mail sent successfully to ${to}`);

    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);

    throw new Error("Unable to send email.");
  }
};
