import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, DollarSign, ExternalLink, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Deal {
  id: string;
  title: string;
  company: string;
  contactName: string;
  value: number;
  probability: number;
  expectedCloseDate: string;
  priority: "low" | "medium" | "high";
}

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
}

export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const initials = deal.contactName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
    <Card
      className={cn(
        "group cursor-pointer hover-elevate active-elevate-2 transition-all duration-200 hover:border-primary/50 hover:shadow-md",
        isDragging && "shadow-lg ring-2 ring-primary",
        onClick && "hover:bg-accent/50"
      )}
      onClick={onClick}
      data-testid={`deal-card-${deal.id}`}
      title="Click to view deal details with AI insights"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate">{deal.title}</h4>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{deal.company}</span>
            </div>
          </div>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-foreground font-mono font-semibold">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            {formatCurrency(deal.value)}
          </div>
          <Badge variant="secondary" className={cn("text-xs", priorityColors[deal.priority])}>
            {deal.priority}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {deal.expectedCloseDate}
          </div>
          <div className="flex items-center gap-2">
            <span>{deal.probability}% prob</span>
            <div title="AI insights available">
              <Brain className="h-3 w-3 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
