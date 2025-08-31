import { Injectable } from '@nestjs/common';
import { AbstractTask, TaskPayload } from '../abstracts/abstract.task';

export interface AlertTriggeredPayload extends TaskPayload {
  alertId: string;
  userId: string;
  alertType: 'security' | 'system' | 'business' | 'warning' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  triggeredTime: string;
  source: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AlertTriggeredTask extends AbstractTask {
  constructor() {
    super('alert_triggered', 'alerts-queue');
  }

  async execute(payload: AlertTriggeredPayload): Promise<void> {
    console.log('Executing alert triggered task', {
      alertId: payload.alertId,
      userId: payload.userId,
      alertType: payload.alertType,
      severity: payload.severity,
      title: payload.title,
      triggeredTime: payload.triggeredTime,
      source: payload.source
    });

    const processingTime = payload.severity === 'critical' ? 100 : 
                          payload.severity === 'high' ? 150 : 
                          payload.severity === 'medium' ? 200 : 250;
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    console.log(`Alert triggered task completed for alert ${payload.alertId}`);
  }
}
