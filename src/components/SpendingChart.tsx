import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ServiceLog } from '@/hooks/useServiceLogs';

interface SpendingChartProps {
  services: ServiceLog[];
}

const CATEGORIES = [
  { key: 'routine', label: 'Routine Service', color: 'hsl(185, 100%, 50%)' },
  { key: 'emergency', label: 'Emergency Repairs', color: 'hsl(0, 80%, 55%)' },
  { key: 'upgrade', label: 'Upgrades', color: 'hsl(30, 95%, 55%)' },
];

const SpendingChart = ({ services }: SpendingChartProps) => {
  const data = CATEGORIES.map(cat => {
    const total = services
      .filter(s => (s as any).service_category === cat.key)
      .reduce((sum, s) => sum + (s.price || 0), 0);
    return { name: cat.label, value: total, color: cat.color };
  }).filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="glass-card neon-border p-5">
        <h3 className="mb-3 font-display text-xs font-bold tracking-wider text-primary uppercase">Maintenance Spending</h3>
        <p className="py-8 text-center font-mono text-xs text-muted-foreground">
          Add service logs with categories to see spending breakdown.
        </p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card neon-border p-5">
      <h3 className="mb-1 font-display text-xs font-bold tracking-wider text-primary uppercase">Maintenance Spending</h3>
      <p className="mb-4 font-mono text-2xl font-bold text-foreground">Rs. {total.toLocaleString()}</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              background: 'hsl(220, 22%, 10%)',
              border: '1px solid hsl(185, 30%, 15%)',
              borderRadius: '8px',
              color: 'hsl(185, 30%, 90%)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          <Legend formatter={(value: string) => <span className="font-mono text-xs text-muted-foreground">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingChart;
