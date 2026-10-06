import welcomeMail from "./welcomeMail.js";
import resetPasswordMail from "./resetPasswordMail.js";
import passwordChangedMail from "./passwordChangedMail.js";
import newLoginMail from "./newLoginMail.js";
import accountDeletedMail from "./accountDeletedMail.js";
import passwordResetSuccessMail from "./passwordResetSuccessMail.js";
import verifyMail from "./verifyMail.js";

const emailTemplates = {
  verifyMail,
  welcomeMail,
  resetPasswordMail,
  passwordResetSuccessMail,
  passwordChangedMail, // from dashboard changed
  newLoginMail,
  accountDeletedMail,
};

//later add orders succesufll
export default emailTemplates;
