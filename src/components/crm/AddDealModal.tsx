import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateDeal } from "@/lib/queries/deals";
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
import { Target, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getDealStageProbability, type DealStage } from "@/lib/utils";

interface AddDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: { id: string; name: string; company: string }[];
  onAdd?: (deal: {
    title: string;
    clientId: string;
    value: number;
    stage: string;
    probability: number;
    expectedCloseDate: string;
    notes: string;
  }) => void;
}

export function AddDealModal({ open, onOpenChange, clients = [], onAdd }: AddDealModalProps) {
  const { user } = useAuth();
  const createDeal = useCreateDeal();
  
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<DealStage>("lead");
  const [priority, setPriority] = useState("medium");
  const [probability, setProbability] = useState([10]); // Set initial probability to 10% for lead stage
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [notes, setNotes] = useState("");

  // Automatically update probability when stage changes
  useEffect(() => {
    const newProbability = getDealStageProbability(stage);
    setProbability([newProbability]);
  }, [stage]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to add a deal.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !clientId || !value.trim()) {
      toast({
        title: "Validation Error",
        description: "Title, client, and value are required.",
        variant: "destructive",
      });
      return;
    }

    const dealValue = parseFloat(value);
    if (isNaN(dealValue) || dealValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Deal value must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDeal.mutateAsync({
        user_id: user.id,
        client_id: clientId,
        title: title.trim(),
        value: dealValue,
        stage: stage,
        priority: priority as 'low' | 'medium' | 'high',
        probability: probability[0],
        expected_close_date: expectedCloseDate || null,
        notes: notes.trim() || null,
      });

      toast({
        title: "Success",
        description: "Deal has been created successfully.",
      });

      // Call the optional callback for backward compatibility
      onAdd?.({
        title,
        clientId,
        value: dealValue,
        stage,
        probability: probability[0],
        expectedCloseDate,
        notes,
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
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
    setProbability([10]); // Reset to 10% for lead stage
    setExpectedCloseDate("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-add-deal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Add New Deal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Enterprise Software License"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-deal-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger data-testid="select-deal-client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Deal Value ($)</Label>
              <Input
                id="value"
                type="number"
                placeholder="50000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                data-testid="input-deal-value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select value={stage} onValueChange={(value: DealStage) => setStage(value)}>
                <SelectTrigger data-testid="select-deal-stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-deal-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Probability</Label>
              <span className="text-sm font-mono text-muted-foreground">{probability[0]}%</span>
            </div>
            <Slider
              value={probability}
              onValueChange={setProbability}
              min={0}
              max={100}
              step={5}
              data-testid="slider-deal-probability"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Expected Close Date
            </Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              data-testid="input-deal-close-date"
              className="dark:[color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this deal..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-deal-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-deal">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createDeal.isPending || !title.trim() || !clientId || !value.trim()} data-testid="button-save-deal">
            {createDeal.isPending ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Saving...
              </div>
            ) : (
              "Add Deal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
