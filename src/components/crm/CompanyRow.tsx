import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, Users, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Company {
  id: string;
  name: string;
  description?: string | null;
  linkedin_url: string;
  website_url?: string | null;
  logo_url?: string | null;
  employee_count?: number | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

interface CompanyRowProps {
  company: Company;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onVisitWebsite?: () => void;
  onVisitLinkedIn?: () => void;
}

export function CompanyRow({ 
  company, 
  onView, 
  onEdit, 
  onDelete, 
  onVisitWebsite, 
  onVisitLinkedIn 
}: CompanyRowProps) {
  const initials = company.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const formatEmployeeCount = (count: number | null | undefined) => {
    if (!count) return "Unknown";
    if (count >= 10000) return `${Math.floor(count / 1000)}k+ employees`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k employees`;
    return `${count} employees`;
  };

  const formatLocation = (address: Company['address']) => {
    if (!address) return "Location not specified";
    const parts = [address.city, address.state, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Location not specified";
  };

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleVisitWebsite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (company.website_url) {
      window.open(company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`, '_blank');
    }
    onVisitWebsite?.();
  };

  const handleVisitLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(company.linkedin_url, '_blank');
    onVisitLinkedIn?.();
  };

  return (
    <tr
      className="border-b border-border hover-elevate cursor-pointer"
      onClick={onView}
      data-testid={`company-row-${company.id}`}
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {company.logo_url ? (
              <AvatarImage src={company.logo_url} alt={company.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{company.name}</p>
            {company.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {company.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{formatEmployeeCount(company.employee_count)}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-muted-foreground">
          {formatLocation(company.address)}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {company.website_url && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleVisitWebsite}
              data-testid={`button-website-${company.id}`}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Website
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleVisitLinkedIn}
            data-testid={`button-linkedin-${company.id}`}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            LinkedIn
          </Button>
        </div>
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {formatCreatedDate(company.created_at)}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" data-testid={`button-more-${company.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Company
              </DropdownMenuItem>
              {company.website_url && (
                <DropdownMenuItem onClick={handleVisitWebsite}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleVisitLinkedIn}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit LinkedIn
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}