// import transporter from "../../config/mailConfig.js";
// import { throwError } from "../errors.js";
// import emailTemplates from "./templates/index.js";

// export const sendEmail = async (emailType, data, to) => {
//   try {
//     const selectedEmailTemplateFn = emailTemplates[emailType];

//     if (!selectedEmailTemplateFn) {
//       throw new Error(`No email template found for type: ${emailType}`);
//     }
//     const FROM_NAME_MAP = {
//       verifyMail: "CartSphere Accounts",
//       welcomeMail: "CartSphere",

//       resetPasswordMail: "CartSphere Security",
//       passwordResetSuccessMail: "CartSphere Security",
//       passwordChangedMail: "CartSphere Security",
//       newLoginMail: "CartSphere Security",
//       accountDeletedMail: "CartSphere Security",

//       orderConfirmMail: "CartSphere Orders",
//       orderShipped: "CartSphere Shipping",
//       invoice: "CartSphere Billing",
//       refund: "CartSphere Refunds",

//       contactUs: "CartSphere Support",
//     };
//     const fromName = FROM_NAME_MAP[emailType] || "CartSphere";

//     const { subject, html, bcc } = selectedEmailTemplateFn(data);

//     const emailOptions = {
//       // from: `CartSphere <${process.env.MAIL_FROM}>`,
//       from: {
//         name: fromName,
//         address: process.env.MAIL_FROM,
//       },
//       to,
//       replyTo: process.env.REPLY_TO,
//       subject,
//       html,
//       ...(bcc && { bcc }),
//     };

//     const emailInfo = await transporter.sendMail(emailOptions);

//     console.log(`✅ Email sent | type=${emailType} to=${to}`);
//     return true;
//   } catch (error) {
//     console.error("Email sending failed:", error.message);
//     throwError(
//       "Unable to send email. Please try again later.",
//       503,
//       null,
//       "EMAIL_SEND_FAILED",
//     );
//   }
// };

// -------------------------------------------------------------- using only brevo set up because render on free version blocked mail

import { throwError } from "../errors.js";
import emailTemplates from "./templates/index.js";

const normalizeRecipients = (value) => {
  if (!value) return [];

  const recipients = Array.isArray(value) ? value : [value];

  return recipients.map((recipient) => {
    if (typeof recipient === "string") {
      return { email: recipient };
    }

    return {
      email: recipient.email || recipient.address,
      ...(recipient.name && { name: recipient.name }),
    };
  });
};

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

    const body = {
      sender: {
        name: fromName,
        email: process.env.MAIL_FROM,
      },
      to: normalizeRecipients(to),
      subject,
      htmlContent: html,
      ...(process.env.REPLY_TO && {
        replyTo: { email: process.env.REPLY_TO },
      }),
      ...(bcc && { bcc: normalizeRecipients(bcc) }),
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${errorDetails}`);
    }

    console.log(`Email sent | type=${emailType} to=${to}`);
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
