import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, UserPlus, Target, Mail, Calendar, FileText } from "lucide-react";

interface QuickActionsProps {
  onAddClient?: () => void;
  onAddDeal?: () => void;
  onComposeEmail?: () => void;
  onScheduleMeeting?: () => void;
  onAddNote?: () => void;
}

export function QuickActions({
  onAddClient,
  onAddDeal,
  onComposeEmail,
  onScheduleMeeting,
  onAddNote,
}: QuickActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="quick-actions">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="h-14 w-14 rounded-full shadow-lg" data-testid="button-quick-actions">
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onAddClient} data-testid="menu-item-add-client">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddDeal} data-testid="menu-item-add-deal">
            <Target className="h-4 w-4 mr-2" />
            Add Deal
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onComposeEmail} data-testid="menu-item-compose-email">
            <Mail className="h-4 w-4 mr-2" />
            Compose Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onScheduleMeeting} data-testid="menu-item-schedule-meeting">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddNote} data-testid="menu-item-add-note">
            <FileText className="h-4 w-4 mr-2" />
            Add Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
