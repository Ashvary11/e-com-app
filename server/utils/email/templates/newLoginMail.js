const newLoginMail = ({
  name,
  loginTime,
  device,
  ipAddress,
}) => {
  const subject = "New login to your CartSphere account";

  const text = `
Hi ${name},

A new login to your CartSphere account was detected.

Login time:
${loginTime}

Device:
${device || "Unknown device"}

IP address:
${ipAddress || "Unavailable"}

If this was you, you can safely ignore this email.

If you do not recognize this login, secure your account immediately by changing your password and reviewing your active sessions.

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
              Account security
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 32px;">

            <h2 style="margin:0 0 16px; font-size:24px;">
              New login detected
            </h2>

            <p style="margin:0 0 16px; font-size:16px; line-height:26px; color:#52525b;">
              Hi ${name},
            </p>

            <p style="margin:0 0 24px; font-size:16px; line-height:26px; color:#52525b;">
              A new login to your CartSphere account was detected.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="background-color:#f4f4f5; border-radius:8px;">

              <tr>
                <td style="padding:14px 16px; border-bottom:1px solid #e4e4e7;">
                  <strong style="font-size:13px;">Login time</strong>
                  <div style="margin-top:4px; font-size:14px; color:#52525b;">
                    ${loginTime}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:14px 16px; border-bottom:1px solid #e4e4e7;">
                  <strong style="font-size:13px;">Device</strong>
                  <div style="margin-top:4px; font-size:14px; color:#52525b;">
                    ${device || "Unknown device"}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:14px 16px;">
                  <strong style="font-size:13px;">IP address</strong>
                  <div style="margin-top:4px; font-size:14px; color:#52525b;">
                    ${ipAddress || "Unavailable"}
                  </div>
                </td>
              </tr>

            </table>

            <p style="margin:24px 0 0; font-size:14px; line-height:22px; color:#71717a;">
              If this was you, you can safely ignore this email.
              If you do not recognize this login, secure your account immediately.
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

export default newLoginMail;