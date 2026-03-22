export const getOTPTemplate = (otp: string, purpose: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mã xác nhận OTP</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                    🔐 Xác Nhận Tài Khoản
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Xin chào,
                  </p>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Bạn đã yêu cầu ${purpose}. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình:
                  </p>

                  <!-- OTP Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center" style="background-color: #f8f9fc; border-radius: 8px; padding: 30px;">
                        <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Warning -->
                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 4px;">
                    <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>⚠️ Lưu ý quan trọng:</strong><br>
                      • Mã OTP có hiệu lực trong <strong>5 phút</strong><br>
                      • Không chia sẻ mã này với bất kỳ ai<br>
                      • Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email
                    </p>
                  </div>

                  <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Trân trọng,<br>
                    <strong style="color: #667eea;">Đội ngũ Manga Website</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fc; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 13px; margin: 0 0 10px 0; line-height: 1.5;">
                    Email này được gửi tự động, vui lòng không trả lời.
                  </p>
                  <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Manga Website. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getWelcomeTemplate = (fullName: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chào mừng đến với Manga Website</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 600;">
                    🎉 Chào mừng bạn!
                  </h1>
                  <p style="color: #e9ecef; margin: 0; font-size: 16px;">
                    Cảm ơn bạn đã đăng ký tài khoản
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 17px; line-height: 1.6; margin: 0 0 20px 0;">
                    Xin chào <strong style="color: #667eea;">${fullName}</strong>,
                  </p>
                  <p style="color: #555555; font-size: 15px; line-height: 1.8; margin: 0 0 30px 0;">
                    Chúc mừng bạn đã đăng ký thành công tài khoản tại <strong>Manga Website</strong>!
                    Giờ đây bạn có thể khám phá hàng nghìn bộ manga hấp dẫn và tham gia cộng đồng yêu thích manga của chúng tôi.
                  </p>

                  <!-- Features -->
                  <div style="background-color: #f8f9fc; border-radius: 8px; padding: 25px; margin: 30px 0;">
                    <h3 style="color: #333333; font-size: 18px; margin: 0 0 20px 0;">
                      ✨ Những gì bạn có thể làm:
                    </h3>
                    <ul style="color: #555555; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                      <li>📚 Đọc manga với chất lượng cao</li>
                      <li>🔖 Lưu manga yêu thích</li>
                      <li>💬 Bình luận và đánh giá</li>
                      <li>🔔 Nhận thông báo chapter mới</li>
                      <li>🪙 Mua coin để đọc các chapter premium</li>
                    </ul>
                  </div>

                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}"
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px;
                              font-size: 16px; font-weight: 600; box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);">
                      🚀 Bắt đầu khám phá ngay
                    </a>
                  </div>

                  <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                    Chúc bạn có những trải nghiệm tuyệt vời!<br>
                    <strong style="color: #667eea;">Đội ngũ Manga Website</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fc; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 13px; margin: 0 0 10px 0;">
                    Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.
                  </p>
                  <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Manga Website. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getPasswordResetSuccessTemplate = (): string => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đổi mật khẩu thành công</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                    ✅ Đổi Mật Khẩu Thành Công
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Xin chào,
                  </p>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
                  </p>

                  <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px 20px; margin: 30px 0; border-radius: 4px;">
                    <p style="color: #155724; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>🔒 Bảo mật tài khoản:</strong><br>
                      • Không chia sẻ mật khẩu với bất kỳ ai<br>
                      • Sử dụng mật khẩu mạnh và khác biệt<br>
                      • Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với chúng tôi
                    </p>
                  </div>

                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login"
                       style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                              color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px;
                              font-size: 16px; font-weight: 600; box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);">
                      Đăng nhập ngay
                    </a>
                  </div>

                  <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Trân trọng,<br>
                    <strong style="color: #28a745;">Đội ngũ Manga Website</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fc; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 13px; margin: 0 0 10px 0;">
                    Email này được gửi tự động, vui lòng không trả lời.
                  </p>
                  <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Manga Website. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
