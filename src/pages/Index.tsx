import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import AppSidebar from '@/components/AppSidebar';
import AddVehicleDialog from '@/components/AddVehicleDialog';
import DashboardView from '@/components/DashboardView';
import ServiceLogsView from '@/components/ServiceLogsView';
import TripsView from '@/components/TripsView';
import FuelLogView from '@/components/FuelLogView';
import DocumentsView from '@/components/DocumentsView';
import TechSpecsView from '@/components/TechSpecsView';
import ModificationsView from '@/components/ModificationsView';
import AnatomyView from '@/components/AnatomyView';
import AuthPage from '@/pages/AuthPage';
import { useServiceLogs } from '@/hooks/useServiceLogs';
import { Activity } from 'lucide-react';
import autoDocLogo from '@/assets/autodoc-logo.png';
import { Vehicle } from '@/hooks/useVehicles';

const AnatomyViewWrapper = ({ vehicle }: { vehicle: Vehicle }) => {
  const { data: services } = useServiceLogs(vehicle.id);
  return <AnatomyView vehicle={vehicle} services={services || []} />;
};

const Index = () => {
  const { user, loading } = useAuth();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-pulse" />
          <span className="font-display text-sm tracking-wider text-primary uppercase">Initializing AutoDoc...</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;

  if (vehicles.length > 0 && !selectedVehicleId) {
    setSelectedVehicleId(vehicles[0].id);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        onAddVehicle={() => setAddDialogOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {vehiclesLoading ? (
          <div className="flex h-full items-center justify-center">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
          </div>
        ) : !selectedVehicle ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <img src={autoDocLogo} alt="AutoDoc" className="h-20 w-20 rounded-2xl glow-cyan" />
            <h2 className="font-display text-xl font-bold tracking-wider text-foreground uppercase">Welcome to AutoDoc</h2>
            <p className="max-w-sm text-muted-foreground">
              Your vehicle diagnostic center. Add your first vehicle to begin monitoring health, service intervals, and performance data.
            </p>
            <button onClick={() => setAddDialogOpen(true)}
              className="gradient-cyan rounded-lg px-6 py-3 font-display text-sm font-bold tracking-wider text-primary-foreground uppercase transition-opacity hover:opacity-90 glow-cyan">
              Register Vehicle
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView vehicle={selectedVehicle} />}
            {activeTab === 'anatomy' && <AnatomyViewWrapper vehicle={selectedVehicle} />}
            {activeTab === 'services' && <ServiceLogsView vehicle={selectedVehicle} />}
            {activeTab === 'fuel' && <FuelLogView vehicle={selectedVehicle} />}
            {activeTab === 'documents' && <DocumentsView vehicle={selectedVehicle} />}
            {activeTab === 'specs' && <TechSpecsView vehicle={selectedVehicle} />}
            {activeTab === 'modifications' && <ModificationsView vehicle={selectedVehicle} />}
            {activeTab === 'trips' && <TripsView vehicle={selectedVehicle} />}
          </>
        )}
      </main>

      <AddVehicleDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};

export default Index;
