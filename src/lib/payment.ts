import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { BakongKHQR, khqrData, IndividualInfo } from "bakong-khqr";
import Stripe from 'stripe';

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface PaymentOptions {
  amount: number;
  currency: 'USD' | 'KHR';
  description: string;
  orderId: string;
  userId: string;
  companyId: string;
  paymentMethod: 'khqr' | 'stripe';
  stripePaymentMethodId?: string; // For Stripe payments
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  qrString?: string; // For KHQR
  md5?: string; // For KHQR
  clientSecret?: string; // For Stripe
}

class PaymentService {
  /**
   * Process a payment using either KHQR or Stripe
   */
  async processPayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      if (options.paymentMethod === 'khqr') {
        return await this.processKhqrPayment(options);
      } else if (options.paymentMethod === 'stripe') {
        return await this.processStripePayment(options);
      } else {
        throw new Error('Invalid payment method');
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Process KHQR payment (existing functionality)
   */
  private async processKhqrPayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      const accountId = process.env.BAKONG_ACCOUNT_ID || "workspace@aclb";
      const merchantName = "KiriHR Software";

      const optionalData = {
        currency: options.currency === "USD" ? khqrData.currency.usd : khqrData.currency.khr,
        amount: parseFloat(options.amount.toString()),
        mobileNumber: "85593988991",
        storeLabel: "KiriHR",
        terminalLabel: "Online",
        purposeOfTransaction: (options.description || "Subscription").substring(0, 25),
        languagePreference: "KM",
        merchantNameAlternateLanguage: merchantName,
        merchantCityAlternateLanguage: "Phnom Penh",
        billNumber: String(options.orderId || "BILL" + Date.now()).replace(/[^a-zA-Z0-9]/g, "").substring(0, 25) || ("BILL" + Date.now()).substring(0, 25),
        expirationTimestamp: Date.now() + (15 * 60 * 1000) // 15 minutes
      };

      const individualInfo = new IndividualInfo(
        accountId,
        merchantName,
        "Phnom Penh",
        optionalData
      );

      const khqr = new BakongKHQR();
      const qrResponse = khqr.generateIndividual(individualInfo);

      if (qrResponse.status.code !== 0 || !qrResponse.data) {
        return {
          success: false,
          error: qrResponse.status.message || "Failed to generate QR"
        };
      }

      return {
        success: true,
        qrString: qrResponse.data.qr,
        md5: qrResponse.data.md5,
        transactionId: options.orderId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to process KHQR payment"
      };
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      // Convert amount to cents for Stripe
      const amountInCents = Math.round(options.amount * 100);

      // Create a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: options.currency === 'USD' ? 'usd' : 'khr',
        description: options.description,
        metadata: {
          orderId: options.orderId,
          userId: options.userId,
          companyId: options.companyId
        },
        // If we have a payment method ID, confirm the payment
        ...(options.stripePaymentMethodId ? {
          payment_method: options.stripePaymentMethodId,
          confirm: true,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-return`
        } : {})
      });

      // If payment requires additional actions (like 3D Secure)
      if (paymentIntent.status === 'requires_action') {
        return {
          success: true,
          clientSecret: paymentIntent.client_secret,
          transactionId: paymentIntent.id,
          requiresAction: true
        };
      }

      // If payment succeeded immediately
      if (paymentIntent.status === 'succeeded') {
        // Update subscription in Firebase
        await this.updateSubscriptionAfterPayment(
          options.companyId,
          options.amount,
          options.currency,
          paymentIntent.id
        );

        return {
          success: true,
          transactionId: paymentIntent.id
        };
      }

      return {
        success: false,
        error: `Payment failed with status: ${paymentIntent.status}`
      };
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process Stripe payment'
      };
    }
  }

  /**
   * Update subscription in Firebase after successful payment
   */
  private async updateSubscriptionAfterPayment(
    companyId: string,
    amount: number,
    currency: string,
    transactionId: string
  ): Promise<void> {
    try {
      // Determine plan type based on amount (this should match your pricing)
      let planType = 'starter_monthly'; // default
      if (amount >= 9.99) {
        planType = 'professional_monthly';
      }
      if (amount >= 95.99) {
        planType = 'professional_yearly';
      }

      const expDate = new Date();
      if (planType.endsWith('_monthly') || planType === 'monthly') {
        expDate.setMonth(expDate.getMonth() + 1);
      } else if (planType.endsWith('_yearly') || planType === 'yearly') {
        expDate.setFullYear(expDate.getFullYear() + 1);
      }

      const subData = {
        type: planType,
        status: 'active',
        expiresAt: expDate.toISOString(),
        updatedAt: new Date().toISOString(),
        lastPaymentHash: transactionId
      };

      await updateDoc(doc(db, "companies_settings", companyId), {
        subscription: subData
      });
    } catch (error) {
      console.error('Error updating subscription after payment:', error);
      // Don't throw here as payment was successful, just log the error
    }
  }

  /**
   * Verify KHQR payment status (existing functionality)
   */
  async verifyKhqrPayment(md5Hash: string): Promise<any> {
    // This would typically call your backend API which calls Bakong
    // For now, we'll return a placeholder - you should integrate with your actual API
    try {
      const response = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ md5: md5Hash })
      });

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }

  /**
   * Verify Stripe payment status
   */
  async verifyStripePayment(paymentIntentId: string): Promise<any> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      throw new Error(`Failed to verify Stripe payment: ${error.message}`);
    }
  }
}

// Create a singleton instance
const paymentService = new PaymentService();
export default paymentService;