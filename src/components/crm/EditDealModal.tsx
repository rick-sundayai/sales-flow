import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateDeal } from "@/lib/queries/deals";
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
import { Slider } from "@/components/ui/slider";
import { Edit3, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getDealStageProbability, type DealStage } from "@/lib/utils";

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  priority: 'low' | 'medium' | 'high';
  probability: number;
  expected_close_date?: string | null;
  notes?: string | null;
  client_id: string;
}

interface EditDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  clients?: { id: string; name: string; company: string }[];
}

export function EditDealModal({ open, onOpenChange, deal, clients = [] }: EditDealModalProps) {
  const { user } = useAuth();
  const updateDeal = useUpdateDeal();
  
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<DealStage>("lead");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>("medium");
  const [probability, setProbability] = useState([50]);
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [notes, setNotes] = useState("");

  // Automatically update probability when stage changes
  useEffect(() => {
    const newProbability = getDealStageProbability(stage);
    setProbability([newProbability]);
  }, [stage]);

  // Populate form when deal data changes
  useEffect(() => {
    if (deal) {
      setTitle(deal.title || "");
      setClientId(deal.client_id || "");
      setValue(deal.value ? deal.value.toString() : "");
      setStage(deal.stage || "lead");
      setPriority(deal.priority || "medium");
      setProbability([deal.probability || 50]);
      setExpectedCloseDate(deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().split('T')[0] : "");
      setNotes(deal.notes || "");
    }
  }, [deal]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a deal.",
        variant: "destructive",
      });
      return;
    }

    if (!deal?.id) {
      toast({
        title: "Error",
        description: "No deal selected for editing.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !clientId || !value.trim()) {
      toast({
        title: "Validation Error",
        description: "Deal title, client, and value are required.",
        variant: "destructive",
      });
      return;
    }

    const dealValue = parseFloat(value);
    if (isNaN(dealValue) || dealValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Deal value must be a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        updates: {
          title: title.trim(),
          client_id: clientId,
          value: dealValue,
          stage: stage,
          priority: priority,
          probability: probability[0],
          expected_close_date: expectedCloseDate || null,
          notes: notes.trim() || null,
        }
      });

      toast({
        title: "Success",
        description: "Deal has been updated successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error",
        description: "Failed to update deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setClientId("");
    setValue("");
    setStage("lead");
    setPriority("medium");
    setProbability([50]);
    setExpectedCloseDate("");
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
      <DialogContent className="max-w-lg" data-testid="modal-edit-deal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Deal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Deal Title</Label>
            <Input
              id="edit-title"
              placeholder="e.g., Website Redesign Project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-edit-deal-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger data-testid="select-edit-deal-client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.company})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Deal Value</Label>
              <Input
                id="edit-value"
                type="number"
                placeholder="50000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                data-testid="input-edit-deal-value"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-stage">Stage</Label>
              <Select value={stage} onValueChange={(value: DealStage) => setStage(value)}>
                <SelectTrigger data-testid="select-edit-deal-stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                <SelectTrigger data-testid="select-edit-deal-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Probability: {probability[0]}%</Label>
            <Slider
              value={probability}
              onValueChange={setProbability}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-edit-deal-probability"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expected-close-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Expected Close Date
            </Label>
            <Input
              id="edit-expected-close-date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              data-testid="input-edit-deal-close-date"
              className="dark:[color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Add any notes about this deal..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-edit-deal-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit-deal">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateDeal.isPending || !title.trim() || !clientId || !value.trim()} 
            data-testid="button-save-edit-deal"
          >
            {updateDeal.isPending ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Updating...
              </div>
            ) : (
              "Update Deal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}