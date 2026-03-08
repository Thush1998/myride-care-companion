import { useState, useEffect, useRef, useCallback } from 'react';
import { Square, Gauge, Clock, Zap, TrendingUp, Navigation, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Vehicle } from '@/hooks/useVehicles';
import { Trip } from '@/hooks/useTrips';

interface ActiveTripDashboardProps {
  vehicle: Vehicle;
  activeTrip: Trip;
  onStopTrip: () => void;
  isEnding: boolean;
  distance: number;
  currentSpeed: number;
  maxSpeed: number;
  avgSpeed: number;
}

const SpeedometerGauge = ({ speed, maxSpeed: topSpeed }: { speed: number; maxSpeed: number }) => {
  const radius = 120;
  const strokeWidth = 10;
  const center = 150;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;

  const clampedSpeed = Math.min(speed, 220);
  const speedRatio = clampedSpeed / 220;
  const needleAngle = startAngle + speedRatio * totalAngle;

  // Arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const largeArc = end - start <= 180 ? '0' : '1';
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const activeEnd = startAngle + speedRatio * totalAngle;

  // Tick marks
  const ticks = [];
  for (let i = 0; i <= 220; i += 20) {
    const ratio = i / 220;
    const angle = startAngle + ratio * totalAngle;
    const innerR = i % 40 === 0 ? radius - 20 : radius - 12;
    const outerR = radius - 4;
    const inner = polarToCartesian(center, center, innerR, angle);
    const outer = polarToCartesian(center, center, outerR, angle);
    const labelPos = polarToCartesian(center, center, radius - 32, angle);
    ticks.push(
      <g key={i}>
        <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
          stroke={i % 40 === 0 ? 'hsl(185 100% 50%)' : 'hsl(185 40% 25%)'}
          strokeWidth={i % 40 === 0 ? 2 : 1} />
        {i % 40 === 0 && (
          <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle"
            fill="hsl(185 30% 60%)" fontSize="11" fontFamily="'JetBrains Mono', monospace">{i}</text>
        )}
      </g>
    );
  }

  // Needle
  const needleTip = polarToCartesian(center, center, radius - 18, needleAngle);
  const needleBase1 = polarToCartesian(center, center, 8, needleAngle - 90);
  const needleBase2 = polarToCartesian(center, center, 8, needleAngle + 90);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(185 100% 50%)" />
            <stop offset="70%" stopColor="hsl(30 95% 55%)" />
            <stop offset="100%" stopColor="hsl(0 80% 55%)" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path d={describeArc(center, center, radius, startAngle, endAngle)}
          fill="none" stroke="hsl(220 18% 13%)" strokeWidth={strokeWidth} strokeLinecap="round" />

        {/* Active arc */}
        <path d={describeArc(center, center, radius, startAngle, activeEnd)}
          fill="none" stroke="url(#speedGradient)" strokeWidth={strokeWidth} strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: 'all 0.3s ease-out' }} />

        {/* Ticks */}
        {ticks}

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill="hsl(0 80% 55%)" filter="url(#glow)"
          style={{ transition: 'all 0.3s ease-out' }} />

        {/* Center circle */}
        <circle cx={center} cy={center} r="12" fill="hsl(220 22% 10%)" stroke="hsl(185 100% 50%)" strokeWidth="2" />
      </svg>

      {/* Digital speed readout */}
      <div className="absolute flex flex-col items-center" style={{ top: '58%' }}>
        <span className="font-mono text-5xl font-bold text-foreground tracking-tight"
          style={{ textShadow: '0 0 20px hsl(185 100% 50% / 0.4)' }}>
          {Math.round(speed)}
        </span>
        <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">km/h</span>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, unit, accent = false }: {
  icon: React.ElementType; label: string; value: string; unit: string; accent?: boolean;
}) => (
  <div className="glass-card p-4 flex flex-col items-center gap-1 min-w-[120px]">
    <Icon className={`h-4 w-4 ${accent ? 'text-accent' : 'text-primary'}`} />
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className={`font-mono text-2xl font-bold ${accent ? 'text-accent' : 'text-foreground'}`}
        style={{ textShadow: accent ? '0 0 12px hsl(30 95% 55% / 0.3)' : '0 0 12px hsl(185 100% 50% / 0.2)' }}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground font-mono">{unit}</span>
    </div>
  </div>
);

const formatDuration = (startTime: string) => {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - start) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const ActiveTripDashboard = ({
  vehicle, activeTrip, onStopTrip, isEnding, distance, currentSpeed, maxSpeed, avgSpeed
}: ActiveTripDashboardProps) => {
  const [elapsed, setElapsed] = useState('00:00:00');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatDuration(activeTrip.start_time));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTrip.start_time]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-auto">
      {/* Scan line effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scan-line absolute inset-0" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-xs text-success tracking-wider uppercase">Live Tracking</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {vehicle.make} {vehicle.model} — {vehicle.plate_no}
        </span>
        <button onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-1 text-xs text-primary font-mono hover:text-primary/80 transition-colors">
          <Navigation className="h-3 w-3" />
          {showMap ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>
      </div>

      {/* Mini map overlay */}
      {showMap && (
        <div className="relative z-10 mx-4 mt-3 h-32 rounded-xl overflow-hidden border border-border/30 bg-card/50 flex items-center justify-center">
          <span className="text-xs text-muted-foreground font-mono">Map requires API key — GPS coordinates active</span>
        </div>
      )}

      {/* Main cockpit area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {/* Speedometer */}
        <SpeedometerGauge speed={currentSpeed} maxSpeed={maxSpeed} />

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
          <MetricCard icon={Navigation} label="Distance" value={distance.toFixed(2)} unit="km" />
          <MetricCard icon={Clock} label="Duration" value={elapsed} unit="" />
          <MetricCard icon={TrendingUp} label="Avg Speed" value={avgSpeed.toFixed(1)} unit="km/h" />
          <MetricCard icon={Zap} label="Max Speed" value={maxSpeed.toFixed(1)} unit="km/h" accent />
        </div>

        {/* Odometer info */}
        <div className="flex gap-6 text-center">
          <div>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Start ODO</span>
            <p className="font-mono text-sm text-foreground">{(activeTrip.start_odometer ?? vehicle.current_odometer).toLocaleString()} km</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Current ODO</span>
            <p className="font-mono text-sm text-primary">{(vehicle.current_odometer + distance).toLocaleString(undefined, { maximumFractionDigits: 1 })} km</p>
          </div>
        </div>
      </div>

      {/* Bottom stop button */}
      <div className="relative z-10 p-6 flex justify-center">
        <Button
          onClick={onStopTrip}
          disabled={isEnding}
          variant="destructive"
          className="w-full max-w-md h-14 text-lg font-bold font-mono gap-3 rounded-2xl shadow-lg"
          style={{ boxShadow: '0 0 30px -5px hsl(0 80% 55% / 0.4)' }}
        >
          <Square className="h-5 w-5" />
          {isEnding ? 'Ending Trip…' : 'STOP TRIP'}
        </Button>
      </div>
    </div>
  );
};

export default ActiveTripDashboard;
