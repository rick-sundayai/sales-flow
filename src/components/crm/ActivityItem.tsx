import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Calendar, FileText, MessageSquare, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityType = "email" | "call" | "meeting" | "note" | "message" | "task";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
}

interface ActivityItemProps {
  activity: Activity;
  isLast?: boolean;
}

export function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const getIcon = () => {
    const iconClass = "h-4 w-4";
    switch (activity.type) {
      case "email":
        return <Mail className={iconClass} />;
      case "call":
        return <Phone className={iconClass} />;
      case "meeting":
        return <Calendar className={iconClass} />;
      case "note":
        return <FileText className={iconClass} />;
      case "message":
        return <MessageSquare className={iconClass} />;
      case "task":
        return <CheckCircle className={iconClass} />;
    }
  };

  const getIconBg = () => {
    switch (activity.type) {
      case "email":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "call":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "meeting":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "note":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "message":
        return "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400";
      case "task":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
    }
  };

  const userName = activity.user || "You";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex gap-3" data-testid={`activity-item-${activity.id}`}>
      <div className="flex flex-col items-center">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", getIconBg())}>
          {getIcon()}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
      </div>
      <div className={cn("flex-1 pb-4", !isLast && "pb-6")}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm">{activity.title}</h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.timestamp}</span>
        </div>
        {activity.description && (
          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{userName}</span>
        </div>
      </div>
    </div>
  );
}
