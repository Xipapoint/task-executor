interface MetricData {
  timestamp: string;
  kafka: {
    consumer: boolean;
    producer: boolean;
    pendingRequests: number;
  };
  sse: {
    totalClients: number;
    clientsByChannel: Record<string, number>;
    averageConnectionDuration: number;
  };
}

interface TrendData {
  sseClients: string | { change: number; direction: string };
  pendingRequests: string | { change: number; direction: string };
  systemStability: string | { percentage: number; status: string };
}

export { MetricData, TrendData };
