'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCommandPalette, CommandPalette } from '@/components/ui/command-palette';
import { DealDrawer } from '@/components/crm/deal-drawer';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target, 
  Activity, 
  Calendar,
  Mail,
  Brain,
  Zap,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';

interface BentoGridDashboardProps {
  metrics?: {
    totalRevenue: number;
    revenueChange: number;
    activeDeals: number;
    dealsChange: number;
    newClients: number;
    clientsChange: number;
    winRate: number;
    winRateChange: number;
  };
  deals?: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
    probability: number;
    priority: string;
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
  }>;
  clients?: Array<{
    id: string;
    contact_name: string;
    company_name?: string;
    email?: string;
  }>;
  recentActivities?: Array<{
    id: string;
    type: string;
    title: string;
    created_at: string;
  }>;
  onEmailClick?: () => void;
  onMeetingClick?: () => void;
}

export function BentoGridDashboard({ 
  metrics = {
    totalRevenue: 0,
    revenueChange: 0,
    activeDeals: 0,
    dealsChange: 0,
    newClients: 0,
    clientsChange: 0,
    winRate: 0,
    winRateChange: 0
  },
  deals = [],
  clients = [],
  recentActivities = [],
  onEmailClick,
  onMeetingClick
}: BentoGridDashboardProps) {
  const { isOpen, onOpen, onClose } = useCommandPalette();
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [isDealDrawerOpen, setIsDealDrawerOpen] = useState(false);

  // Sample data for charts - keeping revenue data as mock for now
  const revenueData = [
    { month: 'Jan', revenue: 45000, deals: 12 },
    { month: 'Feb', revenue: 52000, deals: 15 },
    { month: 'Mar', revenue: 48000, deals: 13 },
    { month: 'Apr', revenue: 61000, deals: 18 },
    { month: 'May', revenue: 55000, deals: 16 },
    { month: 'Jun', revenue: 67000, deals: 20 }
  ];

  // Generate real pipeline data from deals
  const pipelineData = useMemo(() => {
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const stageLabels = {
      'lead': 'Lead',
      'qualified': 'Qualified', 
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed_won': 'Closed Won',
      'closed_lost': 'Closed Lost'
    };

    return stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stage === stage);
      return {
        stage: stageLabels[stage as keyof typeof stageLabels],
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + deal.value, 0)
      };
    });
  }, [deals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <ArrowUpRight className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTopDeal = () => {
    return deals.sort((a, b) => b.value - a.value)[0];
  };

  const openDealDrawer = (dealId: string) => {
    setSelectedDeal(dealId);
    setIsDealDrawerOpen(true);
  };

  const selectedDealData = (() => {
    if (!selectedDeal) return undefined;
    const deal = deals.find(d => d.id === selectedDeal);
    if (!deal) return undefined;
    
    return {
      ...deal,
      activities: [
        {
          id: '1',
          type: 'email',
          title: 'Sent proposal',
          description: 'Sent detailed proposal with pricing options',
          completed: true,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'call',
          title: 'Discovery call',
          description: 'Initial discovery call to understand requirements',
          completed: true,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'meeting',
          title: 'Follow-up scheduled',
          description: 'Scheduled follow-up meeting for next week',
          completed: false,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
  })();

  return (
    <div className="space-y-6">
      {/* Header with Command Palette */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-muted-foreground">Monitor your sales performance and AI insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onOpen}>
            <Search className="h-4 w-4 mr-2" />
            Quick Actions
            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              ⌘K
            </kbd>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[160px]">
        
        {/* Primary Metric - Revenue (Large Card) */}
        <Card className="md:col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium opacity-90">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 opacity-75" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              <div className="flex items-center gap-2 mt-1">
                {getTrendIcon(metrics.revenueChange)}
                <span className="text-sm opacity-90">
                  {metrics.revenueChange > 0 ? '+' : ''}{metrics.revenueChange.toFixed(1)}% vs last month
                </span>
              </div>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="rgba(255,255,255,0.5)" 
                    fill="rgba(255,255,255,0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Active Deals */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{metrics.activeDeals}</p>
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics.dealsChange)}
                <span className={`text-xs ${getTrendColor(metrics.dealsChange)}`}>
                  {metrics.dealsChange > 0 ? '+' : ''}{metrics.dealsChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Clients */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{metrics.newClients}</p>
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics.clientsChange)}
                <span className={`text-xs ${getTrendColor(metrics.clientsChange)}`}>
                  {metrics.clientsChange > 0 ? '+' : ''}{metrics.clientsChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{metrics.winRate.toFixed(0)}%</p>
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics.winRateChange)}
                <span className={`text-xs ${getTrendColor(metrics.winRateChange)}`}>
                  {metrics.winRateChange > 0 ? '+' : ''}{metrics.winRateChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI Insights</CardTitle>
              <Brain className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className="bg-purple-100 text-purple-800">3 High Risk Deals</Badge>
              <p className="text-xs text-muted-foreground">Review recommended</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Deal */}
        {getTopDeal() && (
          <Card 
            className="md:col-span-2 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openDealDrawer(getTopDeal().id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Highest Value Deal</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold truncate">{getTopDeal().title}</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(getTopDeal().value)}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{getTopDeal().stage}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {getTopDeal().probability}% probability
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pipeline Chart */}
        <Card className="md:col-span-2 row-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={pipelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm truncate flex-1">{activity.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={onEmailClick}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={onMeetingClick}>
                <Calendar className="h-4 w-4 mr-2" />
                Meeting
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Automations Status */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Automations</CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className="bg-green-100 text-green-800">5 Active</Badge>
              <p className="text-xs text-muted-foreground">2 triggered today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isOpen}
        onClose={onClose}
        clients={clients}
        deals={deals}
      />

      {/* Deal Drawer */}
      <DealDrawer
        isOpen={isDealDrawerOpen}
        onClose={() => {
          setIsDealDrawerOpen(false);
          setSelectedDeal(null);
        }}
        deal={selectedDealData}
        onSendEmail={(email) => {
          console.log('Sending email:', email);
          // Implement email sending logic
        }}
      />
    </div>
  );
}