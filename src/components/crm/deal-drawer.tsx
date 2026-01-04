'use client';

import { useState } from 'react';
import { SlideOver } from '@/components/ui/slide-over';
import { DealRiskAnalysisComponent } from '@/components/crm/deal-risk-analysis';
import { AIEmailComposer } from '@/components/crm/ai-email-composer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Edit,
  ExternalLink,
  Activity,
  Brain,
  Sparkles,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

interface DealDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: {
    id: string;
    title: string;
    value: number;
    stage: string;
    probability: number;
    priority: string;
    expected_close_date?: string;
    notes?: string;
    client: {
      id: string;
      contact_name: string;
      company_name?: string;
      email?: string;
      phone?: string;
      status: string;
    };
    activities: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      completed: boolean;
      created_at: string;
    }>;
  };
  onSendEmail?: (email: { to: string; subject: string; body: string }) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddActivity?: () => void;
}

export function DealDrawer({ isOpen, onClose, deal, onSendEmail, onEdit, onDelete, onAddActivity }: DealDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!deal) return null;

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'lead': return 'bg-gray-100 text-gray-800';
      case 'qualified': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'task': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={deal.title}
      description={`Deal with ${deal.client.contact_name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Deal Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getStageColor(deal.stage)}>
                {deal.stage.replace('_', ' ')}
              </Badge>
              <Badge className={getPriorityColor(deal.priority)}>
                {deal.priority} priority
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Deal
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Deal
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Deal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Deal Value</p>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">
                  ${deal.value.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Win Probability</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{deal.probability}%</span>
              </div>
            </div>
          </div>

          {deal.expected_close_date && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Expected Close Date</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="font-medium">
                  {formatDate(deal.expected_close_date)}
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Client Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Client Information</h3>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{deal.client.contact_name}</p>
                <p className="text-sm text-muted-foreground">{deal.client.status}</p>
              </div>
            </div>

            {deal.client.company_name && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{deal.client.company_name}</span>
              </div>
            )}

            {deal.client.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{deal.client.email}</span>
              </div>
            )}

            {deal.client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{deal.client.phone}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Tabs for detailed information */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">
              Activities ({deal.activities?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="ai-analysis">
              <Brain className="h-4 w-4 mr-1" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="email-composer">
              <Sparkles className="h-4 w-4 mr-1" />
              AI Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {deal.notes && (
              <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{deal.notes}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity Summary</h4>
              <div className="space-y-2">
                {(deal.activities || []).slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted rounded-md">
                    <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Activity Timeline</h4>
                <Button size="sm" variant="outline" onClick={onAddActivity}>
                  <Activity className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </div>
              <div className="space-y-3">
                {(deal.activities || []).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-md">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <Badge variant={activity.completed ? 'default' : 'secondary'}>
                          {activity.completed ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(activity.created_at)} • {activity.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-analysis">
            <DealRiskAnalysisComponent dealData={deal} />
          </TabsContent>

          <TabsContent value="email-composer">
            <AIEmailComposer 
              dealData={deal}
              onSendEmail={onSendEmail}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SlideOver>
  );
}