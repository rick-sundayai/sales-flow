"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { BentoGridDashboard } from "@/components/dashboard/bento-grid-dashboard";
import { ComposeEmailModal } from "@/components/crm/ComposeEmailModal";
import { ScheduleMeetingModal } from "@/components/crm/ScheduleMeetingModal";
import { AddClientModal } from "@/components/crm/AddClientModal";
import { AddDealModal } from "@/components/crm/AddDealModal";
import { DailyStackModal } from "@/components/crm/DailyStackModal";
import { Button } from "@/components/ui/button";
import { LogOut, Zap } from "lucide-react";
import { useDashboardMetrics } from "@/lib/queries/dashboard";
import { useRecentActivities } from "@/lib/queries/activities";
import { useUpcomingMeetings } from "@/lib/queries/meetings";
import { useClients } from "@/lib/queries/clients";
import { useDeals } from "@/lib/queries/deals";
import { useNewLeadCount } from "@/lib/queries/leads";

export default function DashboardPage() {
  const { user, profile, signOut, loading } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: activities = [], isLoading: activitiesLoading } = useRecentActivities();
  const { isLoading: meetingsLoading } = useUpcomingMeetings();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: newLeadCount = 0 } = useNewLeadCount();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [showDailyStack, setShowDailyStack] = useState(false);

  // Auto-trigger Daily Stack modal if there are new leads
  useEffect(() => {
    if (newLeadCount > 0 && !showDailyStack) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowDailyStack(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [newLeadCount]);

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
        <div className="flex items-center gap-3">
          {/* Daily Stack Trigger Button */}
          {newLeadCount > 0 && (
            <Button
              onClick={() => setShowDailyStack(true)}
              variant="default"
              size="sm"
              className="font-bold relative"
            >
              <Zap className="h-4 w-4 mr-2" />
              Review {newLeadCount} New Lead{newLeadCount > 1 ? 's' : ''}
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-primary items-center justify-center text-xs font-bold text-primary-foreground">
                  {newLeadCount}
                </span>
              </span>
            </Button>
          )}
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
      <DailyStackModal open={showDailyStack} onClose={() => setShowDailyStack(false)} />
    </div>
  );
}
