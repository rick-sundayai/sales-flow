import { useState, useEffect } from "react";
import { useUpdateCompany } from "@/lib/queries/companies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Company {
  id: string;
  name: string;
  description?: string | null;
  linkedin_url: string;
  website_url?: string | null;
  logo_url?: string | null;
  employee_count?: number | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  } | null;
}

interface EditCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
}

export function EditCompanyModal({ open, onOpenChange, company }: EditCompanyModalProps) {
  const updateCompany = useUpdateCompany();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");

  // Populate form when company data changes
  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setDescription(company.description || "");
      setLinkedinUrl(company.linkedin_url || "");
      setWebsiteUrl(company.website_url || "");
      setLogoUrl(company.logo_url || "");
      setEmployeeCount(company.employee_count ? company.employee_count.toString() : "");
      setStreet(company.address?.street || "");
      setCity(company.address?.city || "");
      setState(company.address?.state || "");
      setZipCode(company.address?.zipCode || "");
      setCountry(company.address?.country || "");
    }
  }, [company]);

  const handleSubmit = async () => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "No company selected for editing.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim() || !linkedinUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name and LinkedIn URL are required.",
        variant: "destructive",
      });
      return;
    }

    // Validate LinkedIn URL format
    if (!linkedinUrl.includes('linkedin.com')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid LinkedIn URL.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Build address object if any address fields are provided
      const address = street || city || state || zipCode || country ? {
        street: street.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zipCode: zipCode.trim() || null,
        country: country.trim() || null,
      } : null;

      await updateCompany.mutateAsync({
        id: company.id,
        updates: {
          name: name.trim(),
          description: description.trim() || null,
          linkedin_url: linkedinUrl.trim(),
          website_url: websiteUrl.trim() || null,
          logo_url: logoUrl.trim() || null,
          employee_count: employeeCount ? parseInt(employeeCount) : null,
          address,
        }
      });

      toast({
        title: "Success",
        description: "Company has been updated successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setLinkedinUrl("");
    setWebsiteUrl("");
    setLogoUrl("");
    setEmployeeCount("");
    setStreet("");
    setCity("");
    setState("");
    setZipCode("");
    setCountry("");
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="modal-edit-company">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Company
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Company Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Acme Corporation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-edit-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-employee-count">Employee Count</Label>
                <Input
                  id="edit-employee-count"
                  type="number"
                  placeholder="100"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  data-testid="input-edit-company-employee-count"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Brief description of the company..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-edit-company-description"
              />
            </div>
          </div>

          {/* Online Presence */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Online Presence</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-linkedin-url">LinkedIn URL *</Label>
                <Input
                  id="edit-linkedin-url"
                  placeholder="https://www.linkedin.com/company/acme-corp"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  data-testid="input-edit-company-linkedin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website-url">Website URL</Label>
                <Input
                  id="edit-website-url"
                  placeholder="https://www.acmecorp.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  data-testid="input-edit-company-website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-logo-url">Logo URL</Label>
                <Input
                  id="edit-logo-url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  data-testid="input-edit-company-logo"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Address (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-street">Street Address</Label>
                <Input
                  id="edit-street"
                  placeholder="123 Main Street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  data-testid="input-edit-company-street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  placeholder="New York"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  data-testid="input-edit-company-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State/Province</Label>
                <Input
                  id="edit-state"
                  placeholder="NY"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  data-testid="input-edit-company-state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zip-code">ZIP/Postal Code</Label>
                <Input
                  id="edit-zip-code"
                  placeholder="10001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  data-testid="input-edit-company-zip"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  placeholder="United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  data-testid="input-edit-company-country"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit-company">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateCompany.isPending || !name.trim() || !linkedinUrl.trim()} 
            data-testid="button-save-edit-company"
          >
            {updateCompany.isPending ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Updating...
              </div>
            ) : (
              "Update Company"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}