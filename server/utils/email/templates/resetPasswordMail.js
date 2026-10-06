const resetPasswordMail = ({ name, otp }) => {
  const subject = "Reset your CartSphere password";

  const text = `
Hi ,

We received a request to reset your CartSphere password.

Your password reset OTP is:

${otp}

This OTP is valid for 15 minutes.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

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

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color:#f4f4f5; padding:40px 16px;"
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;"
        >

          <!-- Header -->
          <tr>
            <td
              style="background-color:#18181b; padding:28px 32px; text-align:center;"
            >
              <h1
                style="margin:0; color:#ffffff; font-size:28px; line-height:36px;"
              >
                CartSphere
              </h1>

              <p
                style="margin:8px 0 0; color:#a1a1aa; font-size:14px;"
              >
                Password reset
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">

              <h2
                style="margin:0 0 16px; font-size:24px; line-height:32px;"
              >
                Reset your password
              </h2>

              <p
                style="margin:0 0 16px; font-size:16px; line-height:26px; color:#52525b;"
              >
                Hi,
              </p>

              <p
                style="margin:0 0 28px; font-size:16px; line-height:26px; color:#52525b;"
              >
                We received a request to reset your CartSphere password.
                Use the verification code below to continue.
              </p>

              <!-- OTP -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin-bottom:28px;"
              >
                <tr>
                  <td
                    align="center"
                    style="background-color:#f4f4f5; border-radius:10px; padding:24px;"
                  >
                    <p
                      style="margin:0 0 8px; font-size:12px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; color:#71717a;"
                    >
                      Password Reset Code
                    </p>

                    <p
                      style="margin:0; font-size:32px; line-height:40px; font-weight:bold; letter-spacing:8px; color:#18181b;"
                    >
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>

              <p
                style="margin:0 0 12px; font-size:14px; line-height:22px; color:#52525b;"
              >
                This password reset code is valid for
                <strong>15 minutes</strong>.
              </p>

              <p
                style="margin:0; font-size:14px; line-height:22px; color:#71717a;"
              >
                If you did not request a password reset, you can safely ignore
                this email. Your password will remain unchanged.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              style="padding:20px 32px; border-top:1px solid #e4e4e7; text-align:center;"
            >
              <p
                style="margin:0; font-size:12px; line-height:20px; color:#a1a1aa;"
              >
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

export default resetPasswordMail;
