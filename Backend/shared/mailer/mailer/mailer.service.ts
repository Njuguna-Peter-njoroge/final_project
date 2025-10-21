/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

export interface WelcomeEmailContext {
  name: string;
  email: string;
  companyName?: string;
  supportEmail?: string;
  loginUrl?: string;
}

@Injectable()
export class CustomMailerService {
  private readonly logger = new Logger(CustomMailerService.name);

  public sendOrderStatusUpdateEmail(
    email: string,
    name: string,
    orderId: string,
    status: string,
    reason?: string,
  ): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `Order Status Updated - ${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Order Status Update - Courier Services</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
              .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
              .header { background: #00bfff; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 2.2rem; }
              .content { padding: 32px 24px 24px 24px; }
              .content h2 { color: #f7931e; margin-top: 0; }
              .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Order Status Update</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Your order with ID <strong>${orderId}</strong> status has been updated to <strong>${status}</strong>.</p>
                    ${reason ? `<p>Reason: ${reason}</p>` : ''}
                    <p>You can track your order <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200'}/track/${orderId}">here</a>.</p>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Courier Services. <br>
                    Need help? Contact <a href="mailto:support@courier.com">support@courier.com</a>
                </div>
            </div>
        </body>
        </html>
      `,
    });
  }

  constructor(
    private mailerService: NestMailerService,
    private configService: ConfigService,
  ) {}

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // Check if SMTP credentials are configured
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPass = this.configService.get<string>('SMTP_PASS');

      if (!smtpUser || !smtpPass) {
        this.logger.warn(
          `SMTP credentials not configured. Email would be sent to ${options.to} with subject: ${options.subject}`,
        );
        this.logger.warn(
          `To configure email, set SMTP_USER and SMTP_PASS environment variables`,
        );
        this.logger.log(
          `[DEV MODE] Email simulation successful for ${options.to}`,
        );
        return;
      }

      const mailOptions: any = {
        to: options.to,
        subject: options.subject,
      };

      if (options.template && options.context) {
        mailOptions.template = options.template;
        mailOptions.context = options.context;
      } else if (options.html) {
        mailOptions.html = options.html;
      } else if (options.text) {
        mailOptions.text = options.text;
      }

      const result = await this.mailerService.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${options.to}: ${result.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
      );
      throw error;
    }
  }

  async sendOrderLocationUpdateNotification(
    email: string,
    name: string,
    orderId: string,
    deliveryLat: number,
    deliveryLng: number,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    const googleMapsUrl = `https://www.google.com/maps?q=${deliveryLat},${deliveryLng}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Order Location Update - Courier Services</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
            .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
            .header { background: #00bfff; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 2.2rem; }
            .content { padding: 32px 24px 24px 24px; }
            .content h2 { color: #f7931e; margin-top: 0; }
            .link-button { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #00bfff; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Order Location Updated</h1>
              </div>
              <div class="content">
                  <h2>Hello ${name},</h2>
                  <p>The location of your order <strong>${orderId}</strong> has been updated.</p>
                  <p>You can view the updated location on the map by clicking the button below:</p>
                  <a href="${googleMapsUrl}" class="link-button" target="_blank" rel="noopener noreferrer">View Location on Map</a>
              </div>
              <div class="footer">
                  &copy; ${new Date().getFullYear()} Courier Services. <br>
                  Need help? Contact <a href="mailto:support@courier.com">support@courier.com</a>
              </div>
          </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Order Location Update - ${orderId}`,
      html: htmlContent,
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    otpCode: string,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to Courier Services</title>
                <style>
                  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
                  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
                  .header { background: #f7931e; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
                  .header h1 { margin: 0; font-size: 2.2rem; }
                  .header img { width: 80px; margin-top: 16px; }
                  .content { padding: 32px 24px 24px 24px; }
                  .content h2 { color: #00bfff; margin-top: 0; }
                  .otp-box { background: #f4f8fb; border: 2px dashed #00bfff; border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0; }
                  .otp-code { font-size: 2rem; font-weight: bold; color: #f7931e; letter-spacing: 2px; }
                  .cta { display: block; margin: 32px auto 0 auto; background: #00bfff; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 1.1rem; width: max-content; }
                  .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                    <h1>Welcome to Courier Services!</h1>
                    <img src="https://img.icons8.com/color/96/000000/delivery.png" alt="Welcome" />
                    </div>
                    <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>We're thrilled to have you join our courier services! Your journey to reliable and fast deliveries starts now.</p>
                    <p>To activate your account, please use the verification code below:</p>
                        <div class="otp-box">
                      <div>Your verification code:</div>
                            <div class="otp-code">${otpCode}</div>
                        </div>
                    <p>This code is valid for 10 minutes. If you did not sign up, you can safely ignore this email.</p>
                    <a class="cta" href="${baseUrl}/login">Go to Courier Services</a>
                    </div>
                    <div class="footer">
                    &copy; ${new Date().getFullYear()} Courier Services. <br>
                    Need help? Contact <a href="mailto:support@courier.com">support@courier.com</a>
                    </div>
                </div>
            </body>
            </html>
        `;
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Courier Services - Verify Your Email',
      html: htmlContent,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    otpCode: string,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Password Reset - Courier Services</title>
                <style>
                  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
                  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
                  .header { background: #f44336; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
                  .header h1 { margin: 0; font-size: 2.2rem; }
                  .header img { width: 80px; margin-top: 16px; }
                  .content { padding: 32px 24px 24px 24px; }
                  .content h2 { color: #f44336; margin-top: 0; }
                  .otp-box { background: #f4f8fb; border: 2px dashed #f44336; border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0; }
                  .otp-code { font-size: 2rem; font-weight: bold; color: #f44336; letter-spacing: 2px; }
                  .cta { display: block; margin: 32px auto 0 auto; background: #f44336; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 1.1rem; width: max-content; }
                  .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    <img src="https://img.icons8.com/color/96/000000/lock-2.png" alt="Reset" />
                    </div>
                    <div class="content">
                    <h2>Hello ${name},</h2>
                        <p>We received a request to reset your password for your Courier Services account.</p>
                        <div class="otp-box">
                      <div>Your reset code:</div>
                            <div class="otp-code">${otpCode}</div>
                        </div>
                    <p>This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
                    <a class="cta" href="${baseUrl}/login">Go to Courier Services</a>
                    </div>
                    <div class="footer">
                    &copy; ${new Date().getFullYear()} Courier Services. <br>
                    Need help? Contact <a href="mailto:support@courier.com">support@courier.com</a>
                    </div>
                </div>
            </body>
            </html>
        `;
    await this.sendEmail({
      to: email,
      subject: 'Password Reset - Courier Services',
      html: htmlContent,
    });
  }

  async sendEmailVerification(
    email: string,
    name: string,
    otpCode: string,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Email Verification - Courier Services</title>
                <style>
                  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
                  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
                  .header { background: #00bfff; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
                  .header h1 { margin: 0; font-size: 2.2rem; }
                  .header img { width: 80px; margin-top: 16px; }
                  .content { padding: 32px 24px 24px 24px; }
                  .content h2 { color: #f7931e; margin-top: 0; }
                  .otp-box { background: #f4f8fb; border: 2px dashed #00bfff; border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0; }
                  .otp-code { font-size: 2rem; font-weight: bold; color: #00bfff; letter-spacing: 2px; }
                  .cta { display: block; margin: 32px auto 0 auto; background: #00bfff; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 1.1rem; width: max-content; }
                  .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Email Verification</h1>
                    <img src="https://img.icons8.com/color/96/000000/secured-letter.png" alt="Verify" />
                    </div>
                    <div class="content">
                    <h2>Hello ${name},</h2>
                        <p>Please verify your email address to complete your registration with Courier Services.</p>
                        <div class="otp-box">
                      <div>Your verification code:</div>
                            <div class="otp-code">${otpCode}</div>
                        </div>
                    <p>This code is valid for 10 minutes. If you did not sign up, you can safely ignore this email.</p>
                    <a class="cta" href="${baseUrl}/login">Go to Courier Services</a>
                    </div>
                    <div class="footer">
                    &copy; ${new Date().getFullYear()} Courier Services. <br>
                    Need help? Contact <a href="mailto:support@courier.com">support@courier.com</a>
                    </div>
                </div>
            </body>
            </html>
        `;
    await this.sendEmail({
      to: email,
      subject: 'Email Verification - Courier Services',
      html: htmlContent,
    });
  }

  async sendCourseEnrollmentEmail(
    email: string,
    name: string,
    courseName: string,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Course Enrollment - E-Learning Platform</title>
                <style>
                  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
                  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
                  .header { background: #00bfff; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
                  .header h1 { margin: 0; font-size: 2.2rem; }
                  .header img { width: 80px; margin-top: 16px; }
                  .content { padding: 32px 24px 24px 24px; }
                  .content h2 { color: #f7931e; margin-top: 0; }
                  .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Course Enrollment Confirmation</h1>
                    <img src="https://img.icons8.com/color/96/000000/open-book--v2.png" alt="Enrolled" />
                    </div>
                    <div class="content">
                    <h2>Hello ${name},</h2>
                        <p>You have successfully enrolled in the course: <strong>${courseName}</strong></p>
                        <p>You can now access your course materials and start learning!</p>
                    <a class="cta" href="${baseUrl}/courses">Go to My Courses</a>
                    </div>
                    <div class="footer">
                    &copy; ${new Date().getFullYear()} E-Learning Platform. <br>
                    Need help? Contact <a href="mailto:support@elearning.com">support@elearning.com</a>
                    </div>
                </div>
            </body>
            </html>
        `;
    await this.sendEmail({
      to: email,
      subject: `Parcel  - ${courseName}`,
      html: htmlContent,
    });
  }

  async sendCourseCompletionEmail(
    email: string,
    name: string,
    courseName: string,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Course Completion - E-Learning Platform</title>
                <style>
                  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
                  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
                  .header { background: #f7931e; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
                  .header h1 { margin: 0; font-size: 2.2rem; }
                  .header img { width: 80px; margin-top: 16px; }
                  .content { padding: 32px 24px 24px 24px; }
                  .content h2 { color: #00bfff; margin-top: 0; }
                  .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Course Completion!</h1>
                    <img src="https://img.icons8.com/color/96/000000/certificate.png" alt="Completed" />
                    </div>
                    <div class="content">
                        <h2>Congratulations ${name}!</h2>
                        <p>You have successfully completed the course: <strong>${courseName}</strong></p>
                        <p>Your certificate will be available in your dashboard shortly.</p>
                        <p>Keep up the great work and continue learning!</p>
                    <a class="cta" href="${baseUrl}/dashboard">Go to Dashboard</a>
                    </div>
                    <div class="footer">
                    &copy; ${new Date().getFullYear()} E-Learning Platform. <br>
                    Need help? Contact <a href="mailto:support@elearning.com">support@elearning.com</a>
                    </div>
                </div>
            </body>
            </html>
        `;
    await this.sendEmail({
      to: email,
      subject: `Course Completion - ${courseName}`,
      html: htmlContent,
    });
  }

  async sendOrderConfirmationToSender(
    senderEmail: string,
    senderName: string,
    orderId: string,
    pickupAddress: string,
    deliveryAddress: string,
    packageWeight: string,
    price: string,
  ): Promise<void> {
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Confirmation - Courier Services</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
                    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
                    .header { background: #00bfff; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
                    .header h1 { margin: 0; font-size: 2.2rem; }
                    .order-details { background: #f8f9fa; padding: 24px; margin: 24px 0; border-radius: 12px; }
                    .tracking-number { background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center; }
                    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
                    .detail-label { font-weight: 600; color: #555; }
                    .detail-value { color: #333; }
                    .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📦 Order Confirmed!</h1>
                    </div>
                    <div style="padding: 32px 24px 24px 24px;">
                        <h2>Hello ${senderName},</h2>
                        <p>Your order has been successfully created and is now being processed.</p>
                        <div class="order-details">
                            <div class="order-id">Order ID: ${orderId}</div>
                            <div class="tracking-number">
                                <strong>📦 Tracking Number: ${orderId}</strong>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Pickup Address:</span>
                                <span class="detail-value">${pickupAddress}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Delivery Address:</span>
                                <span class="detail-value">${deliveryAddress}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Package Weight:</span>
                                <span class="detail-value">${packageWeight} kg</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total Price:</span>
                                <span class="detail-value">$${price}</span>
                            </div>
                        </div>
                        <p>You can track your package using the tracking number above on our website.</p>
                    </div>
                    <div class="footer">
                        &copy; ${new Date().getFullYear()} Courier Services. <br>
                        Need help? Contact <a href="mailto:support@courier.com">support@courier.com</a>
                    </div>
                </div>
            </body>
            </html>
        `;
    await this.sendEmail({
      to: senderEmail,
      subject: `Order Confirmation - ${orderId}`,
      html: htmlContent,
    });
  }

  async sendOrderNotificationToRecipient(
    recipientEmail: string,
    recipientName: string,
    orderId: string,
    pickupAddress: string,
    deliveryAddress: string,
    packageWeight: string,
    senderName: string,
  ): Promise<void> {
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Package Incoming - Courier Services</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; }
                    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; }
                    .header { background: #f7931e; color: #fff; padding: 32px 24px 24px 24px; text-align: center; }
                    .header h1 { margin: 0; font-size: 2.2rem; }
                    .order-details { background: #f8f9fa; padding: 24px; margin: 24px 0; border-radius: 12px; }
                    .tracking-number { background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center; }
                    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
                    .detail-label { font-weight: 600; color: #555; }
                    .detail-value { color: #333; }
                    .footer { text-align: center; padding: 24px; color: #888; font-size: 0.97rem; background: #f4f8fb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📦 Package Incoming!</h1>
                    </div>
                    <div style="padding: 32px 24px 24px 24px;">
                        <h2>Hello ${recipientName},</h2>
                        <p>You have a package coming your way from <strong>${senderName}</strong>!</p>
                        <div class="order-details">
                            <div class="tracking-number">
                                <strong>📦 Tracking Number: ${orderId}</strong>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">From:</span>
                                <span class="detail-value">${pickupAddress}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">To:</span>
                                <span class="detail-value">${deliveryAddress}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Package Weight:</span>
                                <span class="detail-value">${packageWeight} kg</span>
                            </div>
                        </div>
                        <p>You can track this package using the tracking number above on our website.</p>
                    </div>
                    <div class="footer">
                        &copy; ${new Date().getFullYear()} Courier Services. <br>
                        Need help? Contact <a href="mailto:support@courier.com">support@courier.com</a>
                    </div>
                </div>
            </body>
            </html>
        `;
    await this.sendEmail({
      to: recipientEmail,
      subject: `Package Incoming - ${orderId}`,
      html: htmlContent,
    });
  }
}
