'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIEmailComposer } from '@/components/crm/ai-email-composer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  TrendingUp,
  Brain,
  Sparkles,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useClient } from '@/lib/queries/clients';
import { useDeals } from '@/lib/queries/deals';
import { useRecentActivities } from '@/lib/queries/activities';
import { geminiService } from '@/lib/services/gemini-service';
import { useMutation } from '@tanstack/react-query';
import { logger } from '@/lib/utils/logger';

interface ClientInsight {
  type: 'opportunity' | 'risk' | 'engagement';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation?: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const clientId = params.id as string;
  
  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: allDeals = [] } = useDeals();
  const { data: activities = [] } = useRecentActivities();
  
  const [insights, setInsights] = useState<ClientInsight[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Filter deals and activities for this client
  const clientDeals = allDeals.filter(deal => deal.client_id === clientId);
  const clientActivities = activities.slice(0, 5); // Use recent activities as mock data

  // Generate AI insights for the client
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('No client data');

      const prompt = `
Analyze this client and provide business insights:

CLIENT INFORMATION:
- Name: ${client.contact_name}
- Company: ${client.company_name || 'Unknown'}
- Status: ${client.status}
- Email: ${client.email || 'Not provided'}
- Phone: ${client.phone || 'Not provided'}

DEAL HISTORY (${clientDeals.length} deals):
${clientDeals.map(deal => `
- ${deal.title}: $${deal.value.toLocaleString()} (${deal.stage}, ${deal.probability}% probability)
`).join('')}

RECENT ACTIVITIES (${clientActivities.length} activities):
${clientActivities.slice(0, 10).map(activity => `
- [${activity.type}] ${activity.title} (${activity.timestamp})
`).join('')}

ANALYSIS REQUIREMENTS:
Provide 3-5 specific insights about this client in the following categories:
1. Opportunities (revenue growth, upsell potential, relationship expansion)
2. Risks (deal concerns, engagement issues, competitive threats)
3. Engagement (communication patterns, relationship health, next actions)

For each insight, provide:
- Type (opportunity/risk/engagement)
- Title (brief headline)
- Description (2-3 sentences explaining the insight)
- Priority (low/medium/high)
- Actionable recommendation (if applicable)

RESPONSE FORMAT (JSON array):
[
  {
    "type": "opportunity|risk|engagement",
    "title": "Brief insight title",
    "description": "Detailed explanation of the insight and its implications",
    "priority": "low|medium|high",
    "actionable": true|false,
    "recommendation": "Specific action to take (if actionable)"
  }
]
      `;

      const result = await geminiService.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No valid JSON found in response');
      
      return JSON.parse(jsonMatch[0]) as ClientInsight[];
    },
    onSuccess: (data) => {
      setInsights(data);
    },
    onError: (error) => {
      logger.error('Failed to generate AI insights', {
        userId: user?.id,
        action: 'ai_insights_generation',
        metadata: { clientId: client?.id, clientName: client?.contact_name },
        error: error as Error
      });
      // Fallback insights
      setInsights([
        {
          type: 'engagement',
          title: 'Regular Follow-up Needed',
          description: 'Consider scheduling a check-in call to maintain the relationship.',
          priority: 'medium',
          actionable: true,
          recommendation: 'Schedule a 30-minute check-in call this week'
        }
      ]);
    }
  });

  const handleSendEmail = (email: { to: string; subject: string; body: string }) => {
    logger.userAction('email_compose', user?.id || 'anonymous', {
      recipient: email.to,
      subject: email.subject,
      bodyLength: email.body.length,
      context: 'client_detail_page'
    });
    // TODO: Integrate with email service
  };

  if (authLoading || clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Client Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested client could not be found.</p>
          <Button onClick={() => router.push('/dashboard/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'churned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'engagement': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const totalDealValue = clientDeals.reduce((sum, deal) => sum + deal.value, 0);
  const activeDealCount = clientDeals.filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage)).length;
  const initials = client.contact_name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard/clients')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{client.contact_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {client.company_name && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{client.company_name}</span>
                  </div>
                )}
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => generateInsightsMutation.mutate()} disabled={generateInsightsMutation.isPending}>
          {generateInsightsMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Generate AI Insights
            </>
          )}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deal Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalDealValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold text-blue-600">{activeDealCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Activities</p>
                <p className="text-2xl font-bold text-purple-600">{clientActivities.length}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">Deals ({clientDeals.length})</TabsTrigger>
          <TabsTrigger value="activities">Activities ({clientActivities.length})</TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-1" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="email">
            <Sparkles className="h-4 w-4 mr-1" />
            AI Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{client.email}</p>
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{client.phone}</p>
                      <p className="text-sm text-muted-foreground">Phone</p>
                    </div>
                  </div>
                )}
                {client.company_name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{client.company_name}</p>
                      <p className="text-sm text-muted-foreground">Company</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{new Date(client.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Client Since</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <div className="space-y-4">
            {clientDeals.length > 0 ? (
              <div className="space-y-3">
                {clientDeals.map((deal) => (
                  <Card key={deal.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/dashboard/pipeline?deal=${deal.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold flex items-center gap-2">
                            {deal.title}
                            <ExternalLink className="h-4 w-4 opacity-50" />
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ${deal.value.toLocaleString()} • {deal.probability}% probability
                          </p>
                        </div>
                        <Badge variant="secondary">{deal.stage.replace('_', ' ')}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">No Deals Yet</h3>
                  <p className="text-muted-foreground mb-4">Create the first deal for this client.</p>
                  <Button onClick={() => router.push('/dashboard/pipeline?action=add')}>
                    Create Deal
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <div className="space-y-4">
            {clientActivities.length > 0 ? (
              <div className="space-y-3">
                {clientActivities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {activity.timestamp} • {activity.type}
                          </p>
                        </div>
                        <Badge variant='default'>
                          Recent
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">No Activities Yet</h3>
                  <p className="text-muted-foreground">Activities will appear here as you interact with this client.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-4">
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <Alert key={index} className={`border-l-4 ${getPriorityColor(insight.priority)}`}>
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{insight.title}</h4>
                        <AlertDescription className="mb-2">
                          {insight.description}
                        </AlertDescription>
                        {insight.actionable && insight.recommendation && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-md">
                            <p className="text-sm font-medium text-blue-900">Recommendation:</p>
                            <p className="text-sm text-blue-800">{insight.recommendation}</p>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={`${insight.priority === 'high' ? 'text-red-600' : insight.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {insight.priority} priority
                      </Badge>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">No Insights Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Click &quot;Generate AI Insights&quot; to analyze this client&apos;s data and get recommendations.
                  </p>
                  <Button onClick={() => generateInsightsMutation.mutate()}>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Insights
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="email">
          <AIEmailComposer
            dealData={clientDeals[0] ? {
              title: `Follow up with ${client.contact_name}`,
              stage: 'follow-up',
              client: {
                contact_name: client.contact_name,
                company_name: client.company_name || undefined,
                email: client.email || undefined,
              }
            } : undefined}
            onSendEmail={handleSendEmail}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}