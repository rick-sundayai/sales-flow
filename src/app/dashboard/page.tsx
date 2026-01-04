"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { BentoGridDashboard } from "@/components/dashboard/bento-grid-dashboard";
import { ComposeEmailModal } from "@/components/crm/ComposeEmailModal";
import { ScheduleMeetingModal } from "@/components/crm/ScheduleMeetingModal";
import { AddClientModal } from "@/components/crm/AddClientModal";
import { AddDealModal } from "@/components/crm/AddDealModal";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useDashboardMetrics } from "@/lib/queries/dashboard";
import { useRecentActivities } from "@/lib/queries/activities";
import { useUpcomingMeetings } from "@/lib/queries/meetings";
import { useClients } from "@/lib/queries/clients";
import { useDeals } from "@/lib/queries/deals";

export default function DashboardPage() {
  const { user, profile, signOut, loading } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: activities = [], isLoading: activitiesLoading } = useRecentActivities();
  const { isLoading: meetingsLoading } = useUpcomingMeetings();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddDealModal, setShowAddDealModal] = useState(false);

  if (loading || metricsLoading || activitiesLoading || meetingsLoading || clientsLoading || dealsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // Middleware will redirect
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };


  return (
    <div className="p-6 space-y-6">
      {/* Welcome Message */}
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Welcome back, {profile?.first_name || user.email}
        </p>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Bento Grid Dashboard */}
      <BentoGridDashboard
        metrics={metrics}
        deals={deals}
        clients={clients.map(client => ({
          id: client.id,
          contact_name: client.contact_name,
          company_name: client.company_name || undefined,
          email: client.email || undefined
        }))}
        recentActivities={activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          created_at: activity.timestamp || new Date().toISOString()
        }))}
        onEmailClick={() => setShowEmailModal(true)}
        onMeetingClick={() => setShowMeetingModal(true)}
      />

      {/* Modals */}
      <ComposeEmailModal open={showEmailModal} onOpenChange={setShowEmailModal} />
      <ScheduleMeetingModal open={showMeetingModal} onOpenChange={setShowMeetingModal} />
      <AddClientModal open={showAddClientModal} onOpenChange={setShowAddClientModal} />
      <AddDealModal
        open={showAddDealModal}
        onOpenChange={setShowAddDealModal}
        clients={clients.map(c => ({ id: c.id, name: c.contact_name, company: c.company_name || '' }))}
      />
    </div>
  );
}
