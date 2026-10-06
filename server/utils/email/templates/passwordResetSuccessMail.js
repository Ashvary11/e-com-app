const passwordResetSuccessMail = ({ name }) => {
  const subject = "Your CartSphere password was reset";

  const text = `
Hi ,

Your CartSphere password has been successfully reset.

You can now sign in using your new password.

If you did not make this change, please contact support immediately.

— CartSphere
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif; color:#18181b;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5; padding:40px 16px;">
  <tr>
    <td align="center">

      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;">

        <tr>
          <td style="background-color:#18181b; padding:28px 32px; text-align:center;">
            <h1 style="margin:0; color:#ffffff; font-size:28px;">
              CartSphere
            </h1>
            <p style="margin:8px 0 0; color:#a1a1aa; font-size:14px;">
              Password security
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 32px;">

            <h2 style="margin:0 0 16px; font-size:24px;">
              Password reset successful
            </h2>

            <p style="margin:0 0 16px; font-size:16px; line-height:26px; color:#52525b;">
              Hi ,
            </p>

            <p style="margin:0 0 24px; font-size:16px; line-height:26px; color:#52525b;">
              Your CartSphere password has been successfully reset.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#f4f4f5; border-radius:8px; padding:16px;">
                  <p style="margin:0; font-size:14px; line-height:22px; color:#52525b;">
                    You can now sign in using your new password.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0; font-size:14px; line-height:22px; color:#71717a;">
              If you did not make this change, please contact support immediately.
            </p>

          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px; border-top:1px solid #e4e4e7; text-align:center;">
            <p style="margin:0; font-size:12px; color:#a1a1aa;">
              © ${new Date().getFullYear()} CartSphere
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
  `.trim();

  return {
    subject,
    text,
    html,
  };
};

export default passwordResetSuccessMail;