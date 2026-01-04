import { useState } from "react";
import { useCreateCompany } from "@/lib/queries/companies";
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

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCompanyModal({ open, onOpenChange }: AddCompanyModalProps) {
  const createCompany = useCreateCompany();
  
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

  const handleSubmit = async () => {
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

      await createCompany.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        linkedin_url: linkedinUrl.trim(),
        website_url: websiteUrl.trim() || null,
        logo_url: logoUrl.trim() || null,
        employee_count: employeeCount ? parseInt(employeeCount) : null,
        address,
      });

      toast({
        title: "Success",
        description: "Company has been created successfully.",
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="modal-add-company">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add New Company
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  placeholder="Acme Corporation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-count">Employee Count</Label>
                <Input
                  id="employee-count"
                  type="number"
                  placeholder="100"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  data-testid="input-company-employee-count"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the company..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-company-description"
              />
            </div>
          </div>

          {/* Online Presence */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Online Presence</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin-url">LinkedIn URL *</Label>
                <Input
                  id="linkedin-url"
                  placeholder="https://www.linkedin.com/company/acme-corp"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  data-testid="input-company-linkedin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <Input
                  id="website-url"
                  placeholder="https://www.acmecorp.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  data-testid="input-company-website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input
                  id="logo-url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  data-testid="input-company-logo"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Address (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  data-testid="input-company-street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  data-testid="input-company-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  data-testid="input-company-state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip-code">ZIP/Postal Code</Label>
                <Input
                  id="zip-code"
                  placeholder="10001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  data-testid="input-company-zip"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  data-testid="input-company-country"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-company">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createCompany.isPending || !name.trim() || !linkedinUrl.trim()} 
            data-testid="button-save-company"
          >
            {createCompany.isPending ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Creating...
              </div>
            ) : (
              "Add Company"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}