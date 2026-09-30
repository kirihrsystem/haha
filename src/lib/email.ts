import nodemailer from 'nodemailer';
import { render } from 'react-dom/server';
import React from 'react';

// Email template imports will be added as we create them
import PaymentConfirmationEmail from '../components/EmailTemplates/PaymentConfirmationEmail';
import SubscriptionReminderEmail from '../components/EmailTemplates/SubscriptionReminderEmail';
import WelcomeEmail from '../components/EmailTemplates/WelcomeEmail';
import FailedPaymentEmail from '../components/EmailTemplates/FailedPaymentEmail';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure nodemailer with environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@kirihr.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendPaymentConfirmation(
    userEmail: string,
    paymentData: {
      amount: number;
      currency: string;
      planName: string;
      transactionId: string;
      date: string;
    }
  ): Promise<boolean> {
    const emailContent = render(<PaymentConfirmationEmail data={paymentData} />);

    return this.sendEmail({
      to: userEmail,
      subject: `Payment Confirmation - Kiri HR Subscription`,
      html: emailContent,
    });
  }

  async sendSubscriptionReminder(
    userEmail: string,
    daysUntilExpiry: number,
    planName: string
  ): Promise<boolean> {
    const emailContent = render(
      <SubscriptionReminderEmail
        daysUntilExpiry={daysUntilExpiry}
        planName={planName}
      />
    );

    return this.sendEmail({
      to: userEmail,
      subject: `Subscription Renewal Reminder - Kiri HR`,
      html: emailContent,
    });
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    companyName: string
  ): Promise<boolean> {
    const emailContent = render(
      <WelcomeEmail
        userName={userName}
        companyName={companyName}
      />
    );

    return this.sendEmail({
      to: userEmail,
      subject: `Welcome to Kiri HR, ${userName}!`,
      html: emailContent,
    });
  }

  async sendFailedPaymentNotification(
    userEmail: string,
    paymentData: {
      amount: number;
      currency: string;
      planName: string;
      errorMessage: string;
    }
  ): Promise<boolean> {
    const emailContent = render(<FailedPaymentEmail data={paymentData} />);

    return this.sendEmail({
      to: userEmail,
      subject: `Payment Failed - Kiri HR Subscription`,
      html: emailContent,
    });
  }
}

// Create a singleton instance
const emailService = new EmailService();
export default emailService;