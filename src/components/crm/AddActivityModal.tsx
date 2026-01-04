import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateActivity } from "@/lib/queries/activities";
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
import { Switch } from "@/components/ui/switch";
import { Activity, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AddActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  defaultDealId?: string;
  clients?: { id: string; name: string; company?: string }[];
  deals?: { id: string; title: string; client?: { name: string } }[];
}

export function AddActivityModal({ 
  open, 
  onOpenChange, 
  defaultClientId = "",
  defaultDealId = "",
  clients = [],
  deals = []
}: AddActivityModalProps) {
  const { user } = useAuth();
  const createActivity = useCreateActivity();
  
  const [type, setType] = useState<'email' | 'call' | 'meeting' | 'task' | 'note'>("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState(defaultClientId);
  const [dealId, setDealId] = useState(defaultDealId);
  const [completed, setCompleted] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to add an activity.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Activity title is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createActivity.mutateAsync({
        user_id: user.id,
        type,
        title: title.trim(),
        description: description.trim() || null,
        client_id: clientId || null,
        deal_id: dealId || null,
        completed,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });

      toast({
        title: "Success",
        description: "Activity has been created successfully.",
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: "Error",
        description: "Failed to create activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setType("note");
    setTitle("");
    setDescription("");
    setClientId(defaultClientId);
    setDealId(defaultDealId);
    setCompleted(false);
    setDueDate("");
  };

  const getTypeIcon = (activityType: string) => {
    switch (activityType) {
      case 'email': return '📧';
      case 'call': return '📞';
      case 'meeting': return '🤝';
      case 'task': return '✅';
      case 'note': return '📝';
      default: return '📝';
    }
  };

  const getTypePlaceholders = (activityType: string) => {
    switch (activityType) {
      case 'email':
        return {
          title: "Follow-up email sent",
          description: "Sent proposal document and pricing information..."
        };
      case 'call':
        return {
          title: "Discovery call completed",
          description: "Discussed requirements and next steps..."
        };
      case 'meeting':
        return {
          title: "Product demo scheduled",
          description: "Meeting details and agenda..."
        };
      case 'task':
        return {
          title: "Prepare contract documents",
          description: "Tasks and requirements..."
        };
      case 'note':
        return {
          title: "Client feedback received",
          description: "Important notes and observations..."
        };
      default:
        return {
          title: "Activity title",
          description: "Activity description..."
        };
    }
  };

  const placeholders = getTypePlaceholders(type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-add-activity">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Add Activity
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Activity Type</Label>
            <Select value={type} onValueChange={(value: 'email' | 'call' | 'meeting' | 'task' | 'note') => setType(value)}>
              <SelectTrigger data-testid="select-activity-type">
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">📝 Note</SelectItem>
                <SelectItem value="email">📧 Email</SelectItem>
                <SelectItem value="call">📞 Call</SelectItem>
                <SelectItem value="meeting">🤝 Meeting</SelectItem>
                <SelectItem value="task">✅ Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={placeholders.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-activity-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={placeholders.description}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-activity-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger data-testid="select-activity-client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal">Deal (Optional)</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger data-testid="select-activity-deal">
                  <SelectValue placeholder="Select deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No deal</SelectItem>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title} {deal.client && `(${deal.client.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(type === 'task' || type === 'meeting') && (
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                data-testid="input-activity-due-date"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="completed"
              checked={completed}
              onCheckedChange={setCompleted}
              data-testid="switch-activity-completed"
            />
            <Label htmlFor="completed">Mark as completed</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-activity">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createActivity.isPending || !title.trim()} 
            data-testid="button-save-activity"
          >
            {createActivity.isPending ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Activity
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}