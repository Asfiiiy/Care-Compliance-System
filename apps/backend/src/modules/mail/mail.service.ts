import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(
    private readonly mailer: MailerService,
  ) {}

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ) {
    return this.mailer.sendMail({
      to,
      subject,
      template,
      context,
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ) {
    return this.sendMail(
      email,
      'Welcome to Care Compliance',
      'welcome',
      {
        name,
      },
    );
  }

  async sendCertificateReminder(
    email: string,
    name: string,
    certificate: string,
    expiryDate: string,
  ) {
    return this.sendMail(
      email,
      'Certificate Expiry Reminder',
      'certificate-expiry',
      {
        name,
        certificate,
        expiryDate,
      },
    );
  }

  async sendTrainingReminder(
    email: string,
    name: string,
    training: string,
    expiryDate: string,
  ) {
    return this.sendMail(
      email,
      'Training Expiry Reminder',
      'training-expiry',
      {
        name,
        training,
        expiryDate,
      },
    );
  }

  async sendNotificationEmail(
    email: string,
    title: string,
    message: string,
  ) {
    return this.sendMail(
      email,
      title,
      'notification',
      {
        title,
        message,
      },
    );
  }

  async sendResetPasswordEmail(
    email: string,
    name: string,
    resetLink: string,
  ) {
    return this.sendMail(
      email,
      'Reset Password',
      'forgot-password',
      {
        name,
        resetLink,
      },
    );
  }

  async sendOtpEmail(
    email: string,
    otp: string,
  ) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px;">
        <h2 style="color: #10b981; text-align: center; margin-bottom: 24px;">Care Compliance Portal</h2>
        <h3 style="color: #1f2937;">Password Reset Verification Code</h3>
        <p style="color: #4b5563; line-height: 1.6;">You requested a password reset for your Care Compliance account. Please use the following One-Time Password (OTP) to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #1f2937; padding: 10px 24px; background-color: #f3f4f6; border-radius: 6px; letter-spacing: 5px; border: 1px dashed #d1d5db;">${otp}</span>
        </div>
        <p style="color: #ef4444; font-size: 14px;"><strong>This OTP is valid for 15 minutes.</strong> For security reasons, do not share this code with anyone.</p>
        <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">If you did not request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Protected by CQC-grade security · v1.0.0</p>
      </div>
    `;

    return this.mailer.sendMail({
      to: email,
      subject: 'Password Reset OTP - Care Compliance',
      html: htmlContent,
    });
  }

  async sendCredentialsEmail(
    email: string,
    name: string,
    role: string,
    passwordPlaintext: string,
    organizationName?: string,
  ) {
    const orgInfo = organizationName
      ? `<p style="color: #4b5563; line-height: 1.6; margin: 4px 0;"><strong>Care Facility:</strong> ${organizationName}</p>`
      : '';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px;">
        <h2 style="color: #10b981; text-align: center; margin-bottom: 24px;">Care Compliance Portal</h2>
        <h3 style="color: #1f2937; margin-bottom: 16px;">Welcome to your Care Compliance Account</h3>
        <p style="color: #4b5563; line-height: 1.6; margin: 12px 0;">Hello ${name},</p>
        <p style="color: #4b5563; line-height: 1.6; margin: 12px 0;">An account has been created for you as a <strong>${role}</strong> on the Care Compliance portal.</p>
        ${orgInfo}
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Email/Username:</strong> ${email}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Password:</strong> ${passwordPlaintext}</p>
        </div>
        <p style="color: #4b5563; line-height: 1.6; margin: 12px 0;">Please use these credentials to log in. For security reasons, we recommend updating your password once you log in.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">Protected by CQC-grade security · v1.0.0</p>
      </div>
    `;

    // Print to console for easy local/development testing
    console.log(`\n==================================================`);
    console.log(`✉️ CREDENTIALS EMAIL SENT TO ${role}: ${email}`);
    console.log(`🔑 PASSWORD: ${passwordPlaintext}`);
    console.log(`==================================================\n`);

    return this.mailer.sendMail({
      to: email,
      subject: 'Your Care Compliance Account Credentials',
      html: htmlContent,
    });
  }

  async sendCqcWarningEmail(
    email: string,
    name: string,
    courseTitle: string,
    statusType: 'EXPIRED' | 'EXPIRING',
    expiryDate: string,
    customNote?: string,
  ) {
    const isExpired = statusType === 'EXPIRED';
    const urgencyColor = isExpired ? '#ef4444' : '#f59e0b';
    const badgeText = isExpired ? 'CRITICAL COMPLIANCE NOTICE: EXPIRED CERTIFICATION' : 'URGENT RENEWAL NOTICE: EXPIRING SOON';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: ${urgencyColor}20; color: ${urgencyColor}; border: 1px solid ${urgencyColor}40; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">
            ${badgeText}
          </span>
        </div>
        <h2 style="color: #1f2937; margin-top: 10px; margin-bottom: 8px;">CQC Regulation 18 Mandatory Training Action Required</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          This is an official compliance notification from your Care Home Management regarding your mandatory CQC Regulation 18 training passport.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid ${urgencyColor}; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #1e293b;"><strong>Course / Module:</strong> ${courseTitle}</p>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #1e293b;"><strong>Expiry Date:</strong> ${expiryDate}</p>
          <p style="margin: 0; font-size: 14px; color: ${urgencyColor};"><strong>Current Status:</strong> ${statusType === 'EXPIRED' ? 'Lapsed / Expired' : 'Expiring within 30 days'}</p>
        </div>
        ${customNote ? `<div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #334155; font-style: italic;"><strong>Manager Note:</strong> "${customNote}"</div>` : ''}
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Please complete your refresher e-learning / assessment and upload your certificate or evidence directly to your Staff Portal to keep the care home CQC inspection-ready.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="http://localhost:3000/dashboard" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Upload Certificate to Staff Portal
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          Care Compliance Matrix & Bedside Auditor · CQC Regulation 18 Enforcement
        </p>
      </div>
    `;

    console.log(`\n==================================================`);
    console.log(`✉️ CQC EXPIRY WARNING EMAIL SENT TO: ${email}`);
    console.log(`📚 COURSE: ${courseTitle} (${statusType} on ${expiryDate})`);
    console.log(`==================================================\n`);

    return this.mailer.sendMail({
      to: email,
      subject: `🚨 Action Required: ${courseTitle} (${statusType}) - Care Home Compliance`,
      html: htmlContent,
    }).catch(err => {
      console.warn(`[SMTP Non-fatal] Warning email simulation to ${email}: ${err.message}`);
    });
  }
}