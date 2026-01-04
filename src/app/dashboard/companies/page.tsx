"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/crm/SearchBar";
import { CompanyRow, type Company } from "@/components/crm/CompanyRow";
import type { Tables } from "@/lib/types/database.types";
import { AddCompanyModal } from "@/components/crm/AddCompanyModal";
import { EditCompanyModal } from "@/components/crm/EditCompanyModal";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { Plus, ArrowUpDown, Building2 } from "lucide-react";
import { useCompanies, useDeleteCompany } from "@/lib/queries/companies";
import { toast } from "@/hooks/use-toast";

export default function CompaniesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: dbCompanies = [], isLoading: companiesLoading } = useCompanies();

  // Transform database companies to match Company interface
  const companies = useMemo(() => {
    return dbCompanies.map((company: Tables<'companies'>) => ({
      ...company,
      address: company.address ? company.address as any : null,
    }));
  }, [dbCompanies]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Company>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  const deleteCompany = useDeleteCompany();

  if (loading || companiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSort = (column: keyof Company) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredCompanies = companies
    .filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
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

  const handleViewCompany = (company: Company) => {
    router.push(`/dashboard/companies/${company.id}`);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowEditCompanyModal(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      await deleteCompany.mutateAsync(selectedCompany.id);
      toast({
        title: "Success",
        description: "Company has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: "Failed to delete company. Please try again.",
        variant: "destructive",
      });
    }
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: keyof Company;
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
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Companies</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {filteredCompanies.length} companies found
            </p>
          </div>
          <Button onClick={() => setShowAddCompanyModal(true)} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
        <SearchBar
          placeholder="Search by company name or description..."
          onSearch={setSearchQuery}
          filterOptions={[]}
        />
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search criteria" : "Get started by adding your first company"}
            </p>
            <Button onClick={() => setShowAddCompanyModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <SortableHeader column="name">Company</SortableHeader>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Size
                    </span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Location
                    </span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Links
                    </span>
                  </th>
                  <SortableHeader column="created_at">Added</SortableHeader>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    onView={() => handleViewCompany(company)}
                    onEdit={() => handleEditCompany(company)}
                    onDelete={() => handleDeleteCompany(company)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCompanyModal open={showAddCompanyModal} onOpenChange={setShowAddCompanyModal} />
      <EditCompanyModal open={showEditCompanyModal} onOpenChange={setShowEditCompanyModal} company={selectedCompany} />
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteCompany}
        title="Delete Company"
        description={`Are you sure you want to delete "${selectedCompany?.name}"? This action cannot be undone.`}
        isLoading={deleteCompany.isPending}
      />
    </div>
  );
}