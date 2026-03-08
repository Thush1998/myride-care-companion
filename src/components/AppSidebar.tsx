import { Car, Gauge, Wrench, Navigation, LogOut, Plus, Fuel, FileText, Cpu, Settings2 } from 'lucide-react';
import { Vehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onAddVehicle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
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
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card/50">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="gradient-amber flex h-9 w-9 items-center justify-center rounded-lg">
          <Car className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground">AutoVault</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Garage</span>
          <button onClick={onAddVehicle} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 space-y-1">
          {vehicles.map(v => (
            <button key={v.id} onClick={() => onSelectVehicle(v.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                selectedVehicleId === v.id ? "bg-primary/10 text-primary glow-amber" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
              {v.image_url ? (
                <img src={v.image_url} alt={v.make} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary"><Car className="h-4 w-4" /></div>
              )}
              <div className="min-w-0">
                <div className="truncate font-medium">{v.nickname || `${v.make} ${v.model}`}</div>
                <div className="truncate text-xs opacity-70">{v.plate_no} · {v.year}</div>
              </div>
            </button>
          ))}
          {vehicles.length === 0 && <p className="px-3 py-4 text-center text-xs text-muted-foreground">No vehicles yet. Add one!</p>}
        </div>

        {selectedVehicleId && (
          <>
            <div className="mb-2 px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigation</span>
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
          <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          <button onClick={signOut} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
