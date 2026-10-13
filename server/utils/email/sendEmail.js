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
      verifyMail: "CartSphere Accounts",
      welcomeMail: "CartSphere",

      resetPasswordMail: "CartSphere Security",
      passwordResetSuccessMail: "CartSphere Security",
      passwordChangedMail: "CartSphere Security",
      newLoginMail: "CartSphere Security",
      accountDeletedMail: "CartSphere Security",

      orderConfirmMail: "CartSphere Orders",
      orderShipped: "CartSphere Shipping",
      invoice: "CartSphere Billing",
      refund: "CartSphere Refunds",

      contactUs: "CartSphere Support",
    };
    const fromName = FROM_NAME_MAP[emailType] || "CartSphere";

    const { subject, html, bcc } = selectedEmailTemplateFn(data);

    const emailOptions = {
      // from: `CartSphere <${process.env.MAIL_FROM}>`,
      from: {
        name: fromName,
        address: process.env.MAIL_FROM,
      },
      to,
      replyTo: process.env.REPLY_TO,
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
