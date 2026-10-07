import transporter from "../../config/mailConfig.js";
import { throwError } from "../errors.js";
import emailTemplates from "./templates/index.js";

export const sendEmail = async (emailType, data, to) => {
  try {
    const selectedEmailTemplateFn = emailTemplates[emailType];

    if (!selectedEmailTemplateFn) {
      throw new Error(`No email template found for type: ${emailType}`);
    }
    const FROM_NAME_MAP = {
      verifyMail: "E-com Accounts",
      welcomeMail: "E-com",
      
      resetPasswordMail: "E-com Security",
      passwordResetSuccessMail: "E-com Security",
      passwordChangedMail: "E-com Security",
      newLoginMail: "E-com Security",
      accountDeletedMail: "E-com Security",

      orderConfirm: "E-com Orders",
      orderShipped: "E-com Shipping",
      invoice: "E-com Billing",
      refund: "E-com Refunds",

      contactUs: "E-com Support",
    };
    const fromName = FROM_NAME_MAP[emailType] || "E-com";

    const { subject, html, bcc } = selectedEmailTemplateFn(data);

    const emailOptions = {
      // from: `E-com <${process.env.MAIL_FROM}>`,
      from: {
        name: fromName,
        address: process.env.MAIL_FROM,
      },
      to,
      // replyTo: process.env.MAIL_FROM,
      subject,
      html,
      ...(bcc && { bcc }),
    };

    const emailInfo = await transporter.sendMail(emailOptions);

    console.log(`✅ Email sent | type=${emailType} to=${to}`);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throwError(
      "Unable to send email. Please try again later.",
      503,
      null,
      "EMAIL_SEND_FAILED",
    );
  }
};
