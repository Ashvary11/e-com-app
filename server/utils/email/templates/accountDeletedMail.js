const accountDeletedMail = ({ name }) => {
  const subject = "Your CartSphere account has been deleted";

  const text = `
Hi ${name},

Your CartSphere account has been successfully deleted.

Your account can no longer be used to sign in.

We're sorry to see you go.

If you did not request this account deletion, please contact support as soon as possible.

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
              Account notification
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 32px;">

            <h2 style="margin:0 0 16px; font-size:24px;">
              Account deleted
            </h2>

            <p style="margin:0 0 16px; font-size:16px; line-height:26px; color:#52525b;">
              Hi ${name},
            </p>

            <p style="margin:0 0 24px; font-size:16px; line-height:26px; color:#52525b;">
              Your CartSphere account has been successfully deleted.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#f4f4f5; border-radius:8px; padding:16px;">
                  <p style="margin:0; font-size:14px; line-height:22px; color:#52525b;">
                    Your account can no longer be used to sign in.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0; font-size:14px; line-height:22px; color:#71717a;">
              We're sorry to see you go. If you did not request this account deletion,
              please contact support as soon as possible.
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
    bcc: ["ashvarygidian1996+e-commerce@gmail.com"],
  };
};

export default accountDeletedMail;
