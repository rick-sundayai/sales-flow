"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/crm/SearchBar";
import { PipelineColumn } from "@/components/crm/PipelineColumn";
import { AddDealModal } from "@/components/crm/AddDealModal";
import { QuickActions } from "@/components/crm/QuickActions";
import { ComposeEmailModal } from "@/components/crm/ComposeEmailModal";
import { ScheduleMeetingModal } from "@/components/crm/ScheduleMeetingModal";
import { AddClientModal } from "@/components/crm/AddClientModal";
import { EditDealModal } from "@/components/crm/EditDealModal";
import { AddActivityModal } from "@/components/crm/AddActivityModal";
import { DealDrawer } from "@/components/crm/deal-drawer";
import { ArrowLeft, Plus } from "lucide-react";
import type { Deal } from "@/components/crm/DealCard";
import { useDeals, useUpdateDealStage, useDeal, useDeleteDeal } from "@/lib/queries/deals";
import { useClients } from "@/lib/queries/clients";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/utils/logger";

// Define pipeline stages with metadata
const PIPELINE_STAGES = [
  { id: "lead", name: "Lead", color: "#6b7280" },
  { id: "qualified", name: "Qualified", color: "#3b82f6" },
  { id: "proposal", name: "Proposal", color: "#8b5cf6" },
  { id: "negotiation", name: "Negotiation", color: "#f59e0b" },
  { id: "closed_won", name: "Closed Won", color: "#10b981" },
  { id: "closed_lost", name: "Closed Lost", color: "#ef4444" },
];

export default function PipelinePage() {
  const { user, loading } = useAuth();
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragTargetStage, setDragTargetStage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isDealDrawerOpen, setIsDealDrawerOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDealModal, setShowEditDealModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [dealToEdit, setDealToEdit] = useState<any>(null);

  const { data: allDeals = [], isLoading: dealsLoading } = useDeals();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: selectedDeal } = useDeal(selectedDealId || '');
  const updateDealStage = useUpdateDealStage();
  const deleteDeal = useDeleteDeal();

  // Populate stages by grouping deals using useMemo to avoid infinite re-renders
  const stages = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => ({
      ...stage,
      deals: allDeals
        .filter((deal) => deal.stage === stage.id)
        .map((deal) => ({
          id: deal.id,
          title: deal.title,
          company: deal.client?.company_name || '',
          contactName: deal.client?.contact_name || '',
          value: deal.value,
          probability: deal.probability,
          expectedCloseDate: new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          priority: deal.priority,
        })),
    }));
  }, [allDeals]);

  if (loading || dealsLoading || clientsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (stageId: string) => {
    setDragTargetStage(stageId);
  };

  const handleDrop = (targetStageId: string) => {
    if (!draggedDeal) return;

    logger.userAction('deal_stage_update', user?.id || 'anonymous', {
      dealId: draggedDeal.id,
      fromStage: 'unknown', // Could be enhanced to track from stage
      toStage: targetStageId
    });

    // Update in Supabase (React Query will automatically refetch and update the UI)
    updateDealStage.mutate({
      id: draggedDeal.id,
      stage: targetStageId as 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost',
    }, {
      onSuccess: () => {
        logger.businessEvent('deal_stage_updated', user?.id || 'anonymous', {
          dealId: draggedDeal.id,
          newStage: targetStageId,
          dealTitle: draggedDeal.title
        });
      },
      onError: (error) => {
        logger.error('Failed to update deal stage', {
          userId: user?.id,
          action: 'deal_stage_update',
          metadata: { dealId: draggedDeal.id, targetStage: targetStageId },
          error: error as Error
        });
      }
    });

    setDraggedDeal(null);
    setDragTargetStage(null);
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDealId(deal.id);
    setIsDealDrawerOpen(true);
  };

  const handleDeleteDeal = (deal: Deal) => {
    setDealToDelete(deal);
    setShowDeleteDialog(true);
  };

  const handleEditDeal = () => {
    if (selectedDeal) {
      // Transform the selectedDeal to match EditDealModal interface
      setDealToEdit({
        id: selectedDeal.id,
        title: selectedDeal.title,
        value: selectedDeal.value,
        stage: selectedDeal.stage,
        priority: selectedDeal.priority,
        probability: selectedDeal.probability,
        expected_close_date: selectedDeal.expected_close_date,
        notes: selectedDeal.notes,
        client_id: selectedDeal.client.id,
      });
      setShowEditDealModal(true);
    }
  };

  const confirmDeleteDeal = async () => {
    if (!dealToDelete) return;
    
    try {
      await deleteDeal.mutateAsync(dealToDelete.id);
      toast({
        title: "Success",
        description: "Deal has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setDealToDelete(null);
      setIsDealDrawerOpen(false); // Close drawer if this deal was open
    } catch (error) {
      logger.error('Failed to delete deal', {
        userId: user?.id,
        action: 'deal_delete',
        metadata: { dealId: dealToDelete.id, dealTitle: dealToDelete.title },
        error: error as Error
      });
      toast({
        title: "Error",
        description: "Failed to delete deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = (email: { to: string; subject: string; body: string }) => {
    logger.userAction('email_compose', user?.id || 'anonymous', {
      recipient: email.to,
      subject: email.subject,
      bodyLength: email.body.length
    });
    // TODO: Integrate with email service
    setShowEmailModal(true);
  };

  const filteredStages = stages.map((stage) => ({
    ...stage,
    deals: stage.deals.filter(
      (deal) =>
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  const totalValue = stages.reduce(
    (sum, stage) => sum + stage.deals.reduce((s, d) => s + d.value, 0),
    0
  );

  const totalDeals = stages.reduce((sum, stage) => sum + stage.deals.length, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 space-y-4 border-b border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Pipeline</h1>
              <p className="text-muted-foreground mt-1">
                {totalDeals} deals worth <span className="font-mono font-semibold text-foreground">${totalValue.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAddDealModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
        <SearchBar
          placeholder="Search deals by name, company, or contact..."
          onSearch={setSearchQuery}
          showFilters={false}
        />
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-h-full">
          {filteredStages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              onDealClick={handleDealClick}
              onDragStart={handleDragStart}
              onDragOver={() => handleDragOver(stage.id)}
              onDrop={() => handleDrop(stage.id)}
              isDragTarget={dragTargetStage === stage.id}
            />
          ))}
        </div>
      </div>

      <QuickActions
        onAddClient={() => setShowAddClientModal(true)}
        onAddDeal={() => setShowAddDealModal(true)}
        onComposeEmail={() => setShowEmailModal(true)}
        onScheduleMeeting={() => setShowMeetingModal(true)}
        onAddNote={() => setShowAddActivityModal(true)}
      />

      <AddDealModal
        open={showAddDealModal}
        onOpenChange={setShowAddDealModal}
        clients={clients.map(c => ({ id: c.id, name: c.contact_name, company: c.company_name || '' }))}
      />
      <ComposeEmailModal open={showEmailModal} onOpenChange={setShowEmailModal} />
      <ScheduleMeetingModal 
        open={showMeetingModal} 
        onOpenChange={setShowMeetingModal} 
        clients={clients.map(c => ({ id: c.id, name: c.contact_name, company: c.company_name || '' }))}
      />
      <AddClientModal open={showAddClientModal} onOpenChange={setShowAddClientModal} />

      {/* Deal Drawer with AI Features */}
      <DealDrawer
        isOpen={isDealDrawerOpen}
        onClose={() => {
          setIsDealDrawerOpen(false);
          setSelectedDealId(null);
        }}
        deal={selectedDeal ? {
          id: selectedDeal.id,
          title: selectedDeal.title,
          value: selectedDeal.value,
          stage: selectedDeal.stage,
          probability: selectedDeal.probability,
          priority: selectedDeal.priority,
          expected_close_date: selectedDeal.expected_close_date,
          notes: selectedDeal.notes,
          client: {
            id: selectedDeal.client.id,
            contact_name: selectedDeal.client.contact_name,
            company_name: selectedDeal.client.company_name,
            email: selectedDeal.client.email,
            phone: selectedDeal.client.phone,
            status: selectedDeal.client.status,
          },
          activities: selectedDeal.activities || [],
        } : undefined}
        onSendEmail={handleSendEmail}
        onEdit={handleEditDeal}
        onDelete={() => selectedDeal && handleDeleteDeal({
          id: selectedDeal.id,
          title: selectedDeal.title,
          company: selectedDeal.client?.company_name || '',
          contactName: selectedDeal.client?.contact_name || '',
          value: selectedDeal.value,
          probability: selectedDeal.probability,
          expectedCloseDate: new Date(selectedDeal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          priority: selectedDeal.priority,
        })}
        onAddActivity={() => setShowAddActivityModal(true)}
      />

      <EditDealModal
        open={showEditDealModal}
        onOpenChange={setShowEditDealModal}
        deal={dealToEdit}
        clients={clients.map(c => ({ id: c.id, name: c.contact_name, company: c.company_name || '' }))}
      />

      <AddActivityModal
        open={showAddActivityModal}
        onOpenChange={setShowAddActivityModal}
        clients={clients.map(c => ({ id: c.id, name: c.contact_name, company: c.company_name || '' }))}
        deals={allDeals.map(d => ({ id: d.id, title: d.title, client: { name: d.client?.contact_name || '' } }))}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteDeal}
        title="Delete Deal"
        description={`Are you sure you want to delete "${dealToDelete?.title}"? This action cannot be undone and will also delete all associated activities.`}
        isLoading={deleteDeal.isPending}
      />
    </div>
  );
}
