import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { FuelLog } from '@/hooks/useFuelLogs';
import { ServiceLog } from '@/hooks/useServiceLogs';
import { format, parseISO, startOfMonth } from 'date-fns';

interface OBDChartsProps {
  fuelLogs: FuelLog[];
  services: ServiceLog[];
}

const OBDCharts = ({ fuelLogs, services }: OBDChartsProps) => {
  // Mileage trend from fuel logs (odometer over time)
  const mileageData = [...fuelLogs]
    .filter(f => f.odometer_at_fill)
    .sort((a, b) => new Date(a.fuel_date).getTime() - new Date(b.fuel_date).getTime())
    .map(f => ({
      date: format(parseISO(f.fuel_date), 'MMM dd'),
      odometer: Number(f.odometer_at_fill),
    }));

  // Monthly spending from service logs
  const monthlyMap = new Map<string, number>();
  services.forEach(s => {
    if (!s.price) return;
    const month = format(startOfMonth(parseISO(s.service_date)), 'MMM yy');
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + s.price);
  });
  const spendingData = Array.from(monthlyMap.entries())
    .map(([month, total]) => ({ month, total }))
    .slice(-12);

  const tooltipStyle = {
    contentStyle: {
      background: 'hsl(220, 22%, 10%)',
      border: '1px solid hsl(185, 30%, 15%)',
      borderRadius: '8px',
      color: 'hsl(185, 30%, 90%)',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
    },
  };

  return (
    <div className="space-y-6">
      {/* Mileage Trend */}
      <div className="glass-card neon-border p-5">
        <h3 className="mb-1 font-display text-xs font-bold tracking-wider text-primary uppercase">Mileage Trend</h3>
        <p className="mb-4 font-mono text-xs text-muted-foreground">Odometer readings over time</p>
        {mileageData.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mileageData}>
              <defs>
                <linearGradient id="mileageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(185, 30%, 12%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(210, 15%, 50%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: 'hsl(210, 15%, 50%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="odometer" stroke="hsl(185, 100%, 50%)" fill="url(#mileageGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center font-mono text-xs text-muted-foreground">Log 2+ fuel entries with odometer readings to see mileage trends.</p>
        )}
      </div>

      {/* Monthly Spending */}
      <div className="glass-card neon-border p-5">
        <h3 className="mb-1 font-display text-xs font-bold tracking-wider text-primary uppercase">Monthly Maintenance Spend</h3>
        <p className="mb-4 font-mono text-xs text-muted-foreground">Service costs aggregated by month</p>
        {spendingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(185, 30%, 12%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(210, 15%, 50%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: 'hsl(210, 15%, 50%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Bar dataKey="total" fill="hsl(30, 95%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center font-mono text-xs text-muted-foreground">Add service logs with prices to see monthly spending analysis.</p>
        )}
      </div>
    </div>
  );
};

export default OBDCharts;
