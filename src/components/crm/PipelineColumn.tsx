import { Badge } from "@/components/ui/badge";
import { DealCard, type Deal } from "./DealCard";
import { cn } from "@/lib/utils";

export interface PipelineStage {
  id: string;
  name: string;
  deals: Deal[];
  color?: string;
}

interface PipelineColumnProps {
  stage: PipelineStage;
  onDealClick?: (deal: Deal) => void;
  onDragStart?: (deal: Deal) => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  isDragTarget?: boolean;
}

export function PipelineColumn({
  stage,
  onDealClick,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}: PipelineColumnProps) {
  const totalValue = stage.deals.reduce((sum, deal) => sum + deal.value, 0);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  return (
    <div
      className={cn(
        "flex flex-col w-80 flex-shrink-0 bg-muted/30 rounded-lg",
        isDragTarget && "ring-2 ring-primary ring-dashed"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.();
      }}
      onDrop={onDrop}
      data-testid={`pipeline-column-${stage.id}`}
    >
      <div className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm p-4 rounded-t-lg border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: stage.color || "hsl(var(--primary))" }}
            />
            <h3 className="font-semibold text-sm">{stage.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {stage.deals.length}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px]">
        {stage.deals.map((deal) => (
          <div
            key={deal.id}
            draggable
            onDragStart={() => onDragStart?.(deal)}
          >
            <DealCard deal={deal} onClick={() => onDealClick?.(deal)} />
          </div>
        ))}
        {stage.deals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No deals in this stage
          </div>
        )}
      </div>
    </div>
  );
}
