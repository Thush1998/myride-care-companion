import { Car, Gauge, Wrench, Navigation, LogOut, Plus, Fuel, FileText, Cpu, Settings2, Zap, Activity } from 'lucide-react';
import { Vehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import autoDocLogo from '@/assets/autodoc-logo.png';

interface AppSidebarProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onAddVehicle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Diagnostics', icon: Activity },
  { id: 'anatomy', label: 'Anatomy X-Ray', icon: Zap },
  { id: 'services', label: 'Service Logs', icon: Wrench },
  { id: 'fuel', label: 'Fuel Log', icon: Fuel },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'specs', label: 'Tech Specs', icon: Cpu },
  { id: 'modifications', label: 'Modifications', icon: Settings2 },
  { id: 'trips', label: 'GPS Tracking', icon: Navigation },
];

const AppSidebar = ({ vehicles, selectedVehicleId, onSelectVehicle, onAddVehicle, activeTab, onTabChange }: AppSidebarProps) => {
  const { signOut, user } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card/30 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="gradient-cyan flex h-9 w-9 items-center justify-center rounded-lg glow-cyan">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="font-display text-sm font-bold tracking-wider text-primary uppercase">AutoDoc</span>
          <p className="text-xs text-muted-foreground">Vehicle Diagnostics</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="font-display text-xs font-bold tracking-widest text-muted-foreground uppercase">Garage</span>
          <button onClick={onAddVehicle} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 space-y-1">
          {vehicles.map(v => (
            <button key={v.id} onClick={() => onSelectVehicle(v.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                selectedVehicleId === v.id ? "bg-primary/10 text-primary neon-border glow-cyan" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
              {v.image_url ? (
                <img src={v.image_url} alt={v.make} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary"><Car className="h-4 w-4" /></div>
              )}
              <div className="min-w-0">
                <div className="truncate font-medium">{v.nickname || `${v.make} ${v.model}`}</div>
                <div className="truncate font-mono text-xs opacity-70">{v.plate_no} · {v.year}</div>
              </div>
            </button>
          ))}
          {vehicles.length === 0 && <p className="px-3 py-4 text-center font-mono text-xs text-muted-foreground">No vehicles yet. Add one!</p>}
        </div>

        {selectedVehicleId && (
          <>
            <div className="mb-2 px-2">
              <span className="font-display text-xs font-bold tracking-widest text-muted-foreground uppercase">Modules</span>
            </div>
            <div className="space-y-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}>
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <span className="truncate font-mono text-xs text-muted-foreground">{user?.email}</span>
          <button onClick={signOut} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
