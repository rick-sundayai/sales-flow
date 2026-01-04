import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateClient } from "@/lib/queries/clients";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCompanyName?: string;
  onAdd?: (client: {
    name: string;
    email: string;
    phone: string;
    company: string;
    status: string;
    notes: string;
  }) => void;
}

export function AddClientModal({ open, onOpenChange, defaultCompanyName, onAdd }: AddClientModalProps) {
  const { user } = useAuth();
  const createClient = useCreateClient();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState(defaultCompanyName || "");
  const [status, setStatus] = useState("prospect");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to add a client.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim() || !company.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name and company are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createClient.mutateAsync({
        user_id: user.id,
        contact_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company_name: company.trim(),
        status: status as 'prospect' | 'active' | 'inactive' | 'churned',
        notes: notes.trim() || null,
      });

      toast({
        title: "Success",
        description: "Client has been created successfully.",
      });

      // Call the optional callback for backward compatibility
      onAdd?.({ name, email, phone, company, status, notes });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany(defaultCompanyName || "");
    setStatus("prospect");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-add-client">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Client
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-client-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Inc"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                data-testid="input-client-company"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-client-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-client-phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-client-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this client..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-client-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-client">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createClient.isPending || !name.trim() || !company.trim()} data-testid="button-save-client">
            {createClient.isPending ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Saving...
              </div>
            ) : (
              "Add Client"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
