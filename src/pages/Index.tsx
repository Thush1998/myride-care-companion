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
import AuthPage from '@/pages/AuthPage';
import { Car } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="gradient-amber h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-primary" />
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !selectedVehicle ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Car className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Welcome to AutoVault</h2>
            <p className="max-w-sm text-muted-foreground">
              Add your first vehicle to get started with service tracking, maintenance alerts, and GPS trip logging.
            </p>
            <button onClick={() => setAddDialogOpen(true)}
              className="gradient-amber rounded-lg px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView vehicle={selectedVehicle} />}
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
