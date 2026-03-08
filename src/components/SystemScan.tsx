import { useState, useEffect } from 'react';
import { Activity, CheckCircle, Shield } from 'lucide-react';

interface ScanItem {
  label: string;
  status: 'scanning' | 'ok' | 'warning' | 'critical';
  value: number;
}

interface SystemScanProps {
  items: ScanItem[];
  onComplete: () => void;
}

const SystemScan = ({ items, onComplete }: SystemScanProps) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [phase, setPhase] = useState<'init' | 'scanning' | 'done'>('init');

  useEffect(() => {
    const initTimer = setTimeout(() => setPhase('scanning'), 600);
    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'scanning') return;
    if (currentIndex >= items.length - 1) {
      const doneTimer = setTimeout(() => {
        setPhase('done');
        setTimeout(onComplete, 800);
      }, 400);
      return () => clearTimeout(doneTimer);
    }
    const timer = setTimeout(() => setCurrentIndex(i => i + 1), 300);
    return () => clearTimeout(timer);
  }, [phase, currentIndex, items.length, onComplete]);

  const statusColor = (s: string) => {
    if (s === 'ok') return 'text-success';
    if (s === 'warning') return 'text-accent';
    return 'text-destructive';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
            <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-wider text-primary uppercase">
              {phase === 'init' ? 'Initializing...' : phase === 'done' ? 'Scan Complete' : 'System Diagnostic'}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {phase === 'scanning' ? `Checking ${currentIndex + 1}/${items.length} subsystems...` : phase === 'done' ? 'All systems verified' : 'Connecting to ECU...'}
            </p>
          </div>
        </div>

        {/* Scan Items */}
        <div className="space-y-2">
          {items.map((item, idx) => {
            const scanned = idx <= currentIndex;
            return (
              <div key={item.label}
                className={`flex items-center justify-between rounded-lg border px-4 py-2.5 font-mono text-sm transition-all duration-300 ${
                  scanned ? 'border-border/60 bg-card/50' : 'border-transparent bg-transparent opacity-30'
                }`}>
                <div className="flex items-center gap-3">
                  {scanned ? (
                    <CheckCircle className={`h-4 w-4 ${statusColor(item.status)}`} />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                  )}
                  <span className={scanned ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                </div>
                {scanned && (
                  <span className={`text-xs font-semibold ${statusColor(item.status)}`}>
                    {item.value}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 glow-cyan"
            style={{ width: `${phase === 'done' ? 100 : ((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>

        {phase === 'done' && (
          <div className="flex items-center justify-center gap-2 text-success">
            <Shield className="h-5 w-5" />
            <span className="font-display text-sm tracking-wider uppercase">Diagnostics Passed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemScan;
