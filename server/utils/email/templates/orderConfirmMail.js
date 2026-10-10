export default function orderConfirmMail(data) {
  const orderItems = (data.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #e4e4e7;">
            <div style="font-size: 14px; line-height: 21px; font-weight: 600; color: #18181b;">
              ${item.name || "Product"}
            </div>
            <div style="margin-top: 4px; font-size: 12px; line-height: 18px; color: #71717a;">
              Quantity: ${item.quantity || 1}
            </div>
          </td>
          <td align="right" valign="middle" style="padding: 14px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; color: #27272a; white-space: nowrap;">
            ₹${(Number(item.price) || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </td>
        </tr>
      `,
    )
    .join("");

  const totalAmount = (Number(data.totalAmount) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    subject: `Order Confirmed! 🎉 Order #${data.orderNumber || data.orderId}`,

    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="light" />
          <title>Order Confirmed - CartSphere</title>
        </head>

        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif; color: #18181b;">

          <!-- Main wrapper -->
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="width: 100%; margin: 0; padding: 0; background-color: #f4f4f5;"
          >
            <tr>
              <td align="center" style="padding: 32px 16px;">

                <!-- Email container -->
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;"
                >

                  <!-- Header -->
                  <tr>
                    <td
                      style="padding: 28px 32px; background-color: #18181b; text-align: center;"
                    >
                      <div style="font-size: 26px; line-height: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                        CartSphere
                      </div>

                      <div style="margin-top: 6px; font-size: 13px; line-height: 20px; color: #d4d4d8;">
                        Your shopping, simplified.
                      </div>
                    </td>
                  </tr>

                  <!-- Main content -->
                  <tr>
                    <td style="padding: 40px 32px 24px 32px;">

                      <div style="font-size: 36px; line-height: 44px; margin-bottom: 16px;">
                        🎉
                      </div>

                      <div style="font-size: 28px; line-height: 36px; font-weight: 700; color: #18181b; margin-bottom: 16px;">
                        Your order is confirmed!
                      </div>

                      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #52525b;">
                        Hi ${data.name || "there"},
                      </p>

                      <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 25px; color: #52525b;">
                        Great news! Your payment was successful, and your CartSphere order has been confirmed.
                        Thank you for choosing us!
                      </p>

                      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 25px; color: #52525b;">
                        Your order is now in our system. You can view your order details anytime to check its status,
                        review your items, and keep track of its progress.
                      </p>

                      <!-- Payment success notice -->
                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;"
                      >
                        <tr>
                          <td style="padding: 16px 18px;">
                            <p style="margin: 0 0 5px 0; font-size: 14px; line-height: 21px; font-weight: 700; color: #166534;">
                              ✓ Payment Successful
                            </p>
                            <p style="margin: 0; font-size: 13px; line-height: 20px; color: #166534;">
                              Your payment has been received successfully.
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Order summary -->
                  <tr>
                    <td style="padding: 8px 32px 28px 32px;">

                      <div style="font-size: 18px; line-height: 26px; font-weight: 700; color: #18181b; margin-bottom: 16px;">
                        Order Summary
                      </div>

                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="border: 1px solid #e4e4e7; border-radius: 8px;"
                      >
                        <tr>
                          <td style="padding: 16px;">
                            <div style="font-size: 12px; line-height: 18px; color: #71717a;">
                              ORDER NUMBER
                            </div>
                            <div style="margin-top: 5px; font-size: 16px; line-height: 24px; font-weight: 700; color: #18181b; overflow-wrap: anywhere;">
                              #${data.orderNumber || data.orderId || ""}
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 0 16px 12px 16px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="padding: 8px 0; font-size: 13px; color: #71717a;">
                                  Order Date
                                </td>
                                <td align="right" style="padding: 8px 0; font-size: 13px; color: #27272a;">
                                  ${data.orderDate || "See order details"}
                                </td>
                              </tr>

                              <tr>
                                <td style="padding: 8px 0; font-size: 13px; color: #71717a;">
                                  Payment Method
                                </td>
                                <td align="right" style="padding: 8px 0; font-size: 13px; color: #27272a;">
                                  ${data.paymentMethod || "Razorpay"}
                                </td>
                              </tr>

                              <tr>
                                <td style="padding: 14px 0 0 0; border-top: 1px solid #e4e4e7; font-size: 14px; font-weight: 700; color: #18181b;">
                                  Total Paid
                                </td>
                                <td align="right" style="padding: 14px 0 0 0; border-top: 1px solid #e4e4e7; font-size: 18px; font-weight: 700; color: #18181b; white-space: nowrap;">
                                  ₹${totalAmount}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Ordered items -->
                  ${
                    orderItems
                      ? `
                        <tr>
                          <td style="padding: 0 32px 28px 32px;">
                            <div style="font-size: 18px; line-height: 26px; font-weight: 700; color: #18181b; margin-bottom: 8px;">
                              Items in Your Order
                            </div>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              ${orderItems}
                            </table>
                          </td>
                        </tr>
                      `
                      : ""
                  }

                  <!-- View order CTA -->
                  <tr>
                    <td style="padding: 0 32px 36px 32px;">

                      <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #52525b;">
                        Want to see your delivery details or check the latest order status?
                        Open your order page anytime to keep track of its progress.
                      </p>

                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="margin: 0 auto 24px auto;"
                      >
                        <tr>
                          <td align="center" style="border-radius: 8px; background-color: #18181b;">
                            <a
                              href="${data.orderUrl || "#"}"
                              target="_blank"
                              style="display: inline-block; padding: 14px 26px; font-size: 15px; line-height: 22px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;"
                            >
                              View Order Details →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; font-size: 12px; line-height: 20px; color: #71717a; overflow-wrap: anywhere;">
                        If the button doesn't work, copy and paste this link into your browser:
                        <br />
                        <a href="${data.orderUrl || "#"}" style="color: #52525b; word-break: break-all;">
                          ${data.orderUrl || ""}
                        </a>
                      </p>

                    </td>
                  </tr>

                  <!-- Demo notice -->
                  <tr>
                    <td style="padding: 0 32px 28px 32px;">
                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px;"
                      >
                        <tr>
                          <td style="padding: 16px 18px;">
                            <p style="margin: 0 0 6px 0; font-size: 13px; line-height: 20px; font-weight: 700; color: #3f3f46;">
                              Project Notice
                            </p>

                            <p style="margin: 0; font-size: 12px; line-height: 19px; color: #71717a;">
                              CartSphere is a personal ecommerce development project created for demonstration and portfolio purposes.
                              It is not a real commercial shopping website.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e4e4e7; text-align: center;">

                      <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 19px; color: #71717a;">
                        Thank you for shopping with CartSphere. We appreciate your trust in us!
                      </p>

                      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
                        © ${new Date().getFullYear()} CartSphere · Demo Project
                      </p>

                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
      </html>
    `,

    text: `
Order Confirmed! 🎉 - CartSphere

Hi ${data.name || "there"},

Great news! Your payment was successful, and your CartSphere order has been confirmed.

ORDER DETAILS
Order Number: #${data.orderNumber || data.orderId || ""}
Order Date: ${data.orderDate || ""}
Payment Method: ${data.paymentMethod || "Razorpay"}
Total Paid: ₹${totalAmount}

ITEMS IN YOUR ORDER
${
  (data.items || [])
    .map(
      (item) =>
        `- ${item.name || "Product"} x ${item.quantity || 1} — ₹${(
          (Number(item.price) || 0) * 1
        ).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    )
    .join("\n") || "View your order for item details."
}

VIEW YOUR ORDER DETAILS
${data.orderUrl || ""}

Visit your order page anytime to check your order status, review your items, and keep track of its progress.

Thank you for shopping with CartSphere!

Project Notice:
CartSphere is a personal ecommerce development project created for demonstration and portfolio purposes.

Thanks,
CartSphere Team
    `,
  };
}
