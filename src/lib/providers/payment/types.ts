export interface CreateOrderParams {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
  userId?: string;
  itemType: 'pack_purchase' | 'event_ticket' | 'restaurant_order';
  itemId: string;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface PaymentProvider {
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  processWebhookEvent(rawBody: string, signature: string): Promise<{ handled: boolean; eventType: string; payload?: any }>;
  refundPayment(paymentId: string, amountInr: number, reason: string): Promise<{ refundId: string }>;
}
