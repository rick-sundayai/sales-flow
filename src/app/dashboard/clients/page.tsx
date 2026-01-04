"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/crm/SearchBar";
import { ClientRow, type Client } from "@/components/crm/ClientRow";
import { AddClientModal } from "@/components/crm/AddClientModal";
import { EditClientModal } from "@/components/crm/EditClientModal";
import { AddActivityModal } from "@/components/crm/AddActivityModal";
import { ComposeEmailModal } from "@/components/crm/ComposeEmailModal";
import { ScheduleMeetingModal } from "@/components/crm/ScheduleMeetingModal";
import { QuickActions } from "@/components/crm/QuickActions";
import { AddDealModal } from "@/components/crm/AddDealModal";
import { Plus, ArrowUpDown } from "lucide-react";
import { useClients, useDeleteClient } from "@/lib/queries/clients";
import { useDeals } from "@/lib/queries/deals";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/utils/logger";

function formatLastContact(date: string | null): string {
  if (!date) return "Never";
  const lastContact = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - lastContact.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return lastContact.toLocaleDateString();
}

export default function ClientsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: dbClients = [], isLoading: clientsLoading } = useClients();
  const { data: allDeals = [], isLoading: dealsLoading } = useDeals();

  // Transform database clients to match Client type expected by ClientRow
  const clients = useMemo<Client[]>(() => {
    return dbClients.map(client => {
      // Calculate deals for this client
      const clientDeals = allDeals.filter(deal => deal.client_id === client.id);
      const totalDeals = clientDeals.length;
      const totalValue = clientDeals.reduce((sum, deal) => sum + deal.value, 0);
      
      return {
        id: client.id,
        name: client.contact_name,
        email: client.email || '',
        phone: client.phone || '',
        company: client.company_name || '',
        status: client.status,
        totalDeals,
        totalValue,
        lastContact: formatLastContact(client.last_contact_at),
      };
    });
  }, [dbClients, allDeals]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<keyof Client>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const deleteClient = useDeleteClient();

  if (loading || clientsLoading || dealsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSort = (column: keyof Client) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

  const handleViewClient = (client: Client) => {
    router.push(`/dashboard/clients/${client.id}`);
  };

  const handleEmailClient = (client: Client) => {
    setSelectedClient(client);
    setShowEmailModal(true);
  };

  const handleScheduleWithClient = (client: Client) => {
    setSelectedClient(client);
    setShowMeetingModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditClientModal(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const handleAddNoteForClient = (client: Client) => {
    setSelectedClient(client);
    setShowAddActivityModal(true);
  };

  const handleCallClient = (client: Client) => {
    if (client.phone) {
      // Open phone app with client's phone number
      window.open(`tel:${client.phone}`, '_self');
    } else {
      toast({
        title: "No Phone Number",
        description: `${client.name} doesn't have a phone number on file.`,
        variant: "destructive",
      });
    }
  };

  const confirmDeleteClient = async () => {
    if (!selectedClient) return;
    
    try {
      await deleteClient.mutateAsync(selectedClient.id);
      toast({
        title: "Success",
        description: "Client has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setSelectedClient(null);
    } catch (error) {
      logger.error('Failed to delete client', {
        userId: user?.id,
        action: 'client_delete',
        metadata: { clientId: selectedClient.id, clientName: selectedClient.name },
        error: error as Error
      });
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Transform Client to database format for EditClientModal
  const selectedDbClient = selectedClient ? {
    id: selectedClient.id,
    contact_name: selectedClient.name,
    email: selectedClient.email || null,
    phone: selectedClient.phone || null,
    company_name: selectedClient.company || null,
    status: selectedClient.status,
    notes: null // We don't have notes in the display format
  } : null;

  const SortableHeader = ({
    column,
    children,
  }: {
    column: keyof Client;
    children: React.ReactNode;
  }) => (
    <th
      className="py-3 px-4 text-left cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </th>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 space-y-4 border-b border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mt-1">
              {filteredClients.length} clients found
            </p>
          </div>
          <Button onClick={() => setShowAddClientModal(true)} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
        <SearchBar
          placeholder="Search by name, email, or company..."
          onSearch={setSearchQuery}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "active", label: "Active" },
            { value: "prospect", label: "Prospect" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <SortableHeader column="name">Client</SortableHeader>
                <SortableHeader column="company">Company</SortableHeader>
                <SortableHeader column="email">Contact</SortableHeader>
                <SortableHeader column="status">Status</SortableHeader>
                <SortableHeader column="totalDeals">Deals</SortableHeader>
                <SortableHeader column="totalValue">Value</SortableHeader>
                <SortableHeader column="lastContact">Last Contact</SortableHeader>
                <th className="py-3 px-4 text-left">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onView={() => handleViewClient(client)}
                  onEmail={() => handleEmailClient(client)}
                  onCall={() => handleCallClient(client)}
                  onSchedule={() => handleScheduleWithClient(client)}
                  onEdit={() => handleEditClient(client)}
                  onDelete={() => handleDeleteClient(client)}
                  onAddNote={() => handleAddNoteForClient(client)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <QuickActions
        onAddClient={() => setShowAddClientModal(true)}
        onAddDeal={() => setShowAddDealModal(true)}
        onComposeEmail={() => setShowEmailModal(true)}
        onScheduleMeeting={() => setShowMeetingModal(true)}
        onAddNote={() => setShowAddActivityModal(true)}
      />

      <AddClientModal open={showAddClientModal} onOpenChange={setShowAddClientModal} />
      <EditClientModal open={showEditClientModal} onOpenChange={setShowEditClientModal} client={selectedDbClient} />
      <AddActivityModal
        open={showAddActivityModal}
        onOpenChange={setShowAddActivityModal}
        defaultClientId={selectedClient?.id}
        clients={clients.map(c => ({ id: c.id, name: c.name, company: c.company }))}
      />
      <ComposeEmailModal open={showEmailModal} onOpenChange={setShowEmailModal} />
      <ScheduleMeetingModal 
        open={showMeetingModal} 
        onOpenChange={setShowMeetingModal} 
        clients={clients.map(c => ({ id: c.id, name: c.name, company: c.company }))}
      />
      <AddDealModal
        open={showAddDealModal}
        onOpenChange={setShowAddDealModal}
        clients={clients.map(c => ({ id: c.id, name: c.name, company: c.company }))}
      />
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteClient}
        title="Delete Client"
        description={`Are you sure you want to delete "${selectedClient?.name}"? This action cannot be undone and will also delete all associated deals and activities.`}
        isLoading={deleteClient.isPending}
      />
    </div>
  );
}
