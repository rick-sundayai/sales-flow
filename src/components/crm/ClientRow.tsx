import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, Phone, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "prospect" | "inactive" | "churned";
  totalDeals: number;
  totalValue: number;
  lastContact: string;
}

interface ClientRowProps {
  client: Client;
  onView?: () => void;
  onEmail?: () => void;
  onCall?: () => void;
  onSchedule?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddNote?: () => void;
}

export function ClientRow({ client, onView, onEmail, onCall, onSchedule, onEdit, onDelete, onAddNote }: ClientRowProps) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const statusColors = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    prospect: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    churned: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <tr
      className="border-b border-border hover-elevate cursor-pointer"
      onClick={onView}
      data-testid={`client-row-${client.id}`}
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{client.name}</p>
            <p className="text-xs text-muted-foreground">{client.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm">{client.company}</span>
      </td>
      <td className="py-4 px-4">
        <Badge variant="secondary" className={cn("text-xs", statusColors[client.status])}>
          {client.status}
        </Badge>
      </td>
      <td className="py-4 px-4 text-sm font-mono">
        {formatCurrency(client.totalValue)}
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {client.totalDeals} deals
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {client.lastContact}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" onClick={onEmail} data-testid={`button-email-${client.id}`}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onCall} data-testid={`button-call-${client.id}`}>
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onSchedule} data-testid={`button-schedule-${client.id}`}>
            <Calendar className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" data-testid={`button-more-${client.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>View details</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>Edit contact</DropdownMenuItem>
              <DropdownMenuItem onClick={onAddNote}>Add note</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
