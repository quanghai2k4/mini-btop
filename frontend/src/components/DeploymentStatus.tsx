import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const logs = [
  "Initializing handshake with server...",
  "Loading Terraform state...",
  "Provisioning AWS resources [EC2 t3.micro]...",
  "Connecting via SSH...",
  "Ansible playbook started...",
  "Installing Nginx web server...",
  "Copying application artifacts...",
  "Configuring firewall rules...",
  "System health check: PASSED",
  "Deployment successful!"
];

interface LogEntry {
  time: string;
  text: string;
}

export function DeploymentStatus() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [buildId] = useState(() => 'v' + Math.floor(Math.random() * 10000) + '.24.01');
  const logAreaRef = useRef<HTMLDivElement>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    logs.forEach((log, index) => {
      setTimeout(() => {
        const time = new Date().toLocaleTimeString();
        setLogEntries(prev => [...prev, { time, text: log }]);
      }, index * 800);
    });
  }, []);

  useEffect(() => {
    if (logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
    }
  }, [logEntries]);

  const formatLogText = (text: string) => {
    return text
      .replace("PASSED", '<span class="text-emerald-400">PASSED</span>')
      .replace("successful!", '<span class="text-emerald-400">successful!</span>');
  };

  return (
    <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d1117] shadow-sm relative">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[100px] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent opacity-10 animate-scanline" />
      </div>

      <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-bold text-blue-500 dark:text-blue-400 font-mono">
          SYSTEM DEPLOYMENT
        </CardTitle>
        <span className="text-emerald-500 font-bold font-mono flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ONLINE
        </span>
      </CardHeader>

      <CardContent className="pt-4 font-mono text-sm">
        {/* Log Area */}
        <div
          ref={logAreaRef}
          className="bg-black rounded p-4 h-[180px] overflow-y-auto border border-zinc-800 mb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {logEntries.map((entry, index) => (
            <div
              key={index}
              className="mb-1 animate-fadeIn text-zinc-300"
            >
              <span className="text-zinc-500 mr-2">[{entry.time}]</span>
              <span dangerouslySetInnerHTML={{ __html: formatLogText(entry.text) }} />
            </div>
          ))}
          {logEntries.length === 0 && (
            <span className="text-zinc-500">Waiting for logs...</span>
          )}
        </div>

        {/* Tech Stack */}
        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-4">
          <p>Infrastructure: <strong className="text-zinc-200">AWS EC2</strong></p>
          <p>Provisioning: <strong className="text-zinc-200">Terraform</strong></p>
          <p>Configuration: <strong className="text-zinc-200">Ansible</strong></p>
          <p>Environment: <strong className="text-zinc-200">Nix Flake</strong></p>
        </div>

        {/* Footer */}
        <div className="text-right text-xs text-zinc-500">
          Build ID: <span className="text-zinc-400">{buildId}</span>
        </div>
      </CardContent>
    </Card>
  );
}
