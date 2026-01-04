import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateClient } from "@/lib/queries/clients";
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
import { UserCog } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Client {
  id: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  status: 'prospect' | 'active' | 'inactive' | 'churned';
  notes?: string | null;
}

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function EditClientModal({ open, onOpenChange, client }: EditClientModalProps) {
  const { user } = useAuth();
  const updateClient = useUpdateClient();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<'prospect' | 'active' | 'inactive' | 'churned'>("prospect");
  const [notes, setNotes] = useState("");

  // Populate form when client data changes
  useEffect(() => {
    if (client) {
      setName(client.contact_name || "");
      setEmail(client.email || "");
      setPhone(client.phone || "");
      setCompany(client.company_name || "");
      setStatus(client.status);
      setNotes(client.notes || "");
    }
  }, [client]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a client.",
        variant: "destructive",
      });
      return;
    }

    if (!client?.id) {
      toast({
        title: "Error",
        description: "No client selected for editing.",
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
      await updateClient.mutateAsync({
        id: client.id,
        updates: {
          contact_name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          company_name: company.trim(),
          status: status,
          notes: notes.trim() || null,
        }
      });

      toast({
        title: "Success",
        description: "Client has been updated successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setStatus("prospect");
    setNotes("");
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-edit-client">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Edit Client
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-edit-client-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                placeholder="Acme Inc"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                data-testid="input-edit-client-company"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="john@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-edit-client-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-edit-client-phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={(value: 'prospect' | 'active' | 'inactive' | 'churned') => setStatus(value)}>
              <SelectTrigger data-testid="select-edit-client-status">
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
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Add any notes about this client..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-edit-client-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit-client">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateClient.isPending || !name.trim() || !company.trim()} data-testid="button-save-edit-client">
            {updateClient.isPending ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Updating...
              </div>
            ) : (
              "Update Client"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}