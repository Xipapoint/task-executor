import { Injectable } from '@nestjs/common';
import { AbstractTask, TaskPayload } from '../abstracts/abstract.task';

export interface PurchasedPayload extends TaskPayload {
  userId: string;
  orderId: string;
  productId: string;
  amount: number;
  currency: string;
  purchaseTime: string;
  paymentMethod: string;
}

@Injectable()
export class PurchasedTask extends AbstractTask {
  constructor() {
    super('purchased', 'payment-queue');
  }

  async execute(payload: PurchasedPayload): Promise<void> {
    console.log('Executing purchased task', {
      userId: payload.userId,
      orderId: payload.orderId,
      productId: payload.productId,
      amount: payload.amount,
      currency: payload.currency,
      purchaseTime: payload.purchaseTime
    });

    // Implement purchase specific logic here
    // For example: update inventory, send confirmation email, process analytics, etc.
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Purchase task completed for order ${payload.orderId}`);
  }
}
