import verifyMail from "./verifyMail.js";
import welcomeMail from "./welcomeMail.js";
import resetPasswordMail from "./resetPasswordMail.js";
import passwordChangedMail from "./passwordChangedMail.js";
import newLoginMail from "./newLoginMail.js";
import accountDeletedMail from "./accountDeletedMail.js";
import passwordResetSuccessMail from "./passwordResetSuccessMail.js";

const emailTemplates = {
  verifyMail,
  welcomeMail,
  
  resetPasswordMail,
  passwordResetSuccessMail,
  passwordChangedMail, // from dashboard changed
  newLoginMail,
  accountDeletedMail,
};

 
export default emailTemplates;
