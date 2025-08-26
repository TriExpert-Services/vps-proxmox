// Payment processing service with Stripe integration
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface Invoice {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  created: number;
  dueDate: number;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
}

class PaymentService {
  private stripePublicKey: string;
  private stripeSecretKey: string;

  constructor(publicKey: string, secretKey: string) {
    this.stripePublicKey = publicKey;
    this.stripeSecretKey = secretKey;
  }

  // Create payment intent
  async createPaymentIntent(amount: number, currency = 'usd', customerId?: string): Promise<PaymentIntent> {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
        body: JSON.stringify({
          amount: amount * 100, // Stripe uses cents
          currency,
          customer: customerId,
          automatic_payment_methods: {
            enabled: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId: string, paymentMethod: string): Promise<PaymentIntent> {
    try {
      const response = await fetch(`/api/payments/confirm/${paymentIntentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment confirmation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw error;
    }
  }

  // Create customer
  async createCustomer(email: string, name: string, address?: any): Promise<any> {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
        body: JSON.stringify({
          email,
          name,
          address,
        }),
      });

      if (!response.ok) {
        throw new Error('Customer creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Customer creation failed:', error);
      throw error;
    }
  }

  // Create subscription for recurring payments
  async createSubscription(customerId: string, priceId: string): Promise<any> {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
        body: JSON.stringify({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        }),
      });

      if (!response.ok) {
        throw new Error('Subscription creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw error;
    }
  }

  // Generate invoice
  async createInvoice(customerId: string, items: InvoiceItem[]): Promise<Invoice> {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
        body: JSON.stringify({
          customer: customerId,
          collection_method: 'send_invoice',
          days_until_due: 30,
          invoice_items: items.map(item => ({
            description: item.description,
            amount: item.amount * 100,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Invoice creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Invoice creation failed:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(paymentIntentId: string, amount?: number): Promise<any> {
    try {
      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
        body: JSON.stringify({
          payment_intent: paymentIntentId,
          ...(amount && { amount: amount * 100 }),
        }),
      });

      if (!response.ok) {
        throw new Error('Refund processing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Refund processing failed:', error);
      throw error;
    }
  }

  // Get payment methods for customer
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`/api/customers/${customerId}/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      throw error;
    }
  }

  // Usage-based billing
  async reportUsage(subscriptionItemId: string, quantity: number, timestamp?: number): Promise<void> {
    try {
      await fetch('/api/usage-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.stripeSecretKey}`,
        },
        body: JSON.stringify({
          subscription_item: subscriptionItemId,
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'set',
        }),
      });
    } catch (error) {
      console.error('Usage reporting failed:', error);
      throw error;
    }
  }

  // Webhook handling
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // Stripe webhook signature verification
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

export default PaymentService;