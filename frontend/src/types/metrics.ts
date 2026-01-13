export interface CPUMetrics {
  total: number;
  perCore: number[];
}

export interface MemoryMetrics {
  total: number;
  used: number;
  available: number;
  usedPercent: number;
}

export interface DiskMetrics {
  total: number;
  used: number;
  free: number;
  usedPercent: number;
}

export interface NetworkMetrics {
  bytesRecv: number;
  bytesSent: number;
  rxRate: number;
  txRate: number;
  isSpike: boolean;
}

export interface LoadAvgMetrics {
  load1: number;
  load5: number;
  load15: number;
}

export interface SystemMetrics {
  timestamp: number;
  hostname: string;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  loadAverage: LoadAvgMetrics;
  uptime: number;
}
