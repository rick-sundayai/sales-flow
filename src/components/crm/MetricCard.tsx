import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, trend, trendLabel, icon }: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend || trend === 0) return <Minus className="h-4 w-4" />;
    return trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend || trend === 0) return "text-muted-foreground";
    return trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  return (
    <Card data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 font-mono">{value}</p>
            {(trend !== undefined || trendLabel) && (
              <div className={cn("flex items-center gap-1 mt-2 text-sm", getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {trend !== undefined && `${trend > 0 ? "+" : ""}${trend}%`}
                  {trendLabel && ` ${trendLabel}`}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
