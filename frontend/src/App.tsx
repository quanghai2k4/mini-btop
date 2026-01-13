import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { useEffect, useState, useRef } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { DeploymentStatus } from '@/components/DeploymentStatus';
import { Badge } from '@/components/ui/badge';
import { Cpu, MemoryStick, HardDrive, Wifi, Moon, Sun, Server } from 'lucide-react';
import { formatBytes, formatGB, formatUptime } from '@/lib/utils';

function App() {
  const { metrics, connected } = useSystemMetrics();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Network history for sparkline
  const [networkHistory, setNetworkHistory] = useState<{ value: number }[]>([]);
  const lastNetworkRef = useRef<number>(0);

  useEffect(() => {
    // Default to dark mode for btop-style
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Update network history for sparkline
  useEffect(() => {
    if (metrics) {
      const totalRate = metrics.network.rxRate + metrics.network.txRate;
      const now = Date.now();
      
      // Only add point every 500ms
      if (now - lastNetworkRef.current > 500) {
        lastNetworkRef.current = now;
        setNetworkHistory(prev => {
          const newHistory = [...prev, { value: totalRate / 1024 }]; // KB/s
          if (newHistory.length > 20) {
            return newHistory.slice(-20);
          }
          return newHistory;
        });
      }
    }
  }, [metrics]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-6 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Hello, {metrics.hostname}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-1">
            <Server className="h-4 w-4" />
            System Monitor Dashboard
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="px-3 py-1.5 bg-white dark:bg-zinc-900 text-sm font-normal border-zinc-200 dark:border-zinc-800">
            Uptime: <span className="font-semibold ml-1">{formatUptime(metrics.uptime)}</span>
          </Badge>
          
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-xs font-medium ${connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            ) : (
              <Sun className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="CPU Usage"
          value={`${metrics.cpu.total.toFixed(1)}%`}
          subValue={`${metrics.cpu.perCore?.length || 0} Cores`}
          icon={Cpu}
          percent={metrics.cpu.total}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10 dark:bg-blue-500/20"
          gradientId="cpuGradient"
          gradientColor="#3b82f6"
        />

        <MetricCard
          title="Memory"
          value={`${metrics.memory.usedPercent.toFixed(1)}%`}
          subValue={`${formatGB(metrics.memory.used)} GB / ${formatGB(metrics.memory.total)} GB`}
          icon={MemoryStick}
          percent={metrics.memory.usedPercent}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10 dark:bg-purple-500/20"
          gradientId="memGradient"
          gradientColor="#a855f7"
        />

        <MetricCard
          title="Disk Usage"
          value={`${metrics.disk.usedPercent.toFixed(1)}%`}
          subValue={`${formatGB(metrics.disk.used)} GB / ${formatGB(metrics.disk.total)} GB`}
          icon={HardDrive}
          percent={metrics.disk.usedPercent}
          iconColor="text-rose-500"
          iconBgColor="bg-rose-500/10 dark:bg-rose-500/20"
          gradientId="diskGradient"
          gradientColor="#f43f5e"
        />

        <MetricCard
          title="Network"
          value={formatBytes(metrics.network.rxRate + metrics.network.txRate) + '/s'}
          subValue={`Down ${formatBytes(metrics.network.rxRate)}/s · Up ${formatBytes(metrics.network.txRate)}/s`}
          icon={Wifi}
          useChart={true}
          chartData={networkHistory.length > 2 ? networkHistory : [{ value: 0 }, { value: 0 }, { value: 0 }]}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10 dark:bg-emerald-500/20"
          gradientId="networkGradient"
          gradientColor="#10b981"
        />
      </div>

      {/* Deployment Status */}
      <div className="mt-6">
        <DeploymentStatus />
      </div>
    </div>
  );
}

export default App;
