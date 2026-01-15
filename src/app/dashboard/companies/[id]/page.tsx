'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EditCompanyModal } from '@/components/crm/EditCompanyModal';
import { AddClientModal } from '@/components/crm/AddClientModal';
import { AddActivityModal } from '@/components/crm/AddActivityModal';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Globe,
  MapPin,
  Users,
  TrendingUp,
  Activity,
  ExternalLink,
  Edit,
  Plus,
  Linkedin,
  Clock,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { useCompany } from '@/lib/queries/companies';
import { useClients } from '@/lib/queries/clients';
import { useDeals } from '@/lib/queries/deals';
import { useRecentActivities } from '@/lib/queries/activities';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const companyId = params.id as string;
  
  const { data: companyData, isLoading: companyLoading } = useCompany(companyId);
  // Type assertion to handle legacy field naming inconsistencies
  const company = companyData as typeof companyData & {
    website?: string;
    industry?: string;
    phone?: string;
  };
  const { data: allClients = [] } = useClients();
  const { data: allDeals = [] } = useDeals();
  const { data: activities = [] } = useRecentActivities();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);

  // Filter data for this company
  const companyClients = allClients.filter(client => 
    client.company_name?.toLowerCase() === company?.name?.toLowerCase()
  );
  const companyClientIds = companyClients.map(client => client.id);
  const companyDeals = allDeals.filter(deal => companyClientIds.includes(deal.client_id));
  // Filter activities for company clients and deals
  const companyActivities = activities.filter(activity => 
    (activity.client_id && companyClientIds.includes(activity.client_id)) ||
    (activity.deal_id && companyDeals.some(deal => deal.id === activity.deal_id))
  ).slice(0, 10); // Show up to 10 relevant activities

  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested company could not be found.</p>
          <Button onClick={() => router.push('/dashboard/companies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  const formatEmployeeCount = (count?: number) => {
    if (!count) return 'Unknown';
    if (count < 10) return '1-10';
    if (count < 50) return '11-50';
    if (count < 200) return '51-200';
    if (count < 1000) return '201-1,000';
    if (count < 5000) return '1,001-5,000';
    return '5,000+';
  };

  const formatAddress = (address: unknown) => {
    if (!address || typeof address !== 'object') return 'No address provided';
    const addressObj = address as { 
      street?: string; 
      city?: string; 
      state?: string; 
      country?: string; 
      zipCode?: string; 
    };
    const { street, city, state, country, zipCode } = addressObj;
    const parts = [street, city, state, country, zipCode].filter(Boolean);
    return parts.join(', ') || 'Address not complete';
  };

  const ensureHttpProtocol = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const totalDealValue = companyDeals.reduce((sum, deal) => sum + deal.value, 0);
  const activeDealCount = companyDeals.filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage)).length;
  const initials = company.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard/companies')}
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
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {company?.industry && (
                  <Badge variant="outline">
                    {company.industry}
                  </Badge>
                )}
                {company.employee_count && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{formatEmployeeCount(company.employee_count)} employees</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddClientModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold text-purple-600">{companyClients.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activities</p>
                <p className="text-2xl font-bold text-orange-600">{companyActivities.length}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({companyClients.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({companyDeals.length})</TabsTrigger>
          <TabsTrigger value="activities">Activities ({companyActivities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <a 
                        href={ensureHttpProtocol(company.website)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:underline flex items-center gap-1"
                      >
                        {company.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-muted-foreground">Website</p>
                    </div>
                  </div>
                )}
                {company.linkedin_url && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <a 
                        href={ensureHttpProtocol(company.linkedin_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:underline flex items-center gap-1"
                      >
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-muted-foreground">LinkedIn</p>
                    </div>
                  </div>
                )}
                {company.industry && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{company.industry}</p>
                      <p className="text-sm text-muted-foreground">Industry</p>
                    </div>
                  </div>
                )}
                {company.employee_count && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatEmployeeCount(company.employee_count)}</p>
                      <p className="text-sm text-muted-foreground">Company Size</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{new Date(company.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Added to CRM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address & Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-medium">{formatAddress(company.address)}</p>
                    <p className="text-sm text-muted-foreground">Headquarters</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {company.description && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{company.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="space-y-4">
            {companyClients.length > 0 ? (
              <div className="space-y-3">
                {companyClients.map((client) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {client.contact_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {client.contact_name}
                              <ExternalLink className="h-4 w-4 opacity-50" />
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {client.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {client.email}
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{client.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">No Contacts Yet</h3>
                  <p className="text-muted-foreground mb-4">Add the first contact for this company.</p>
                  <Button onClick={() => setShowAddClientModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <div className="space-y-4">
            {companyDeals.length > 0 ? (
              <div className="space-y-3">
                {companyDeals.map((deal) => (
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
                          <p className="text-xs text-muted-foreground mt-1">
                            Expected close: {new Date(deal.expected_close_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{deal.stage.replace('_', ' ')}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{deal.priority} priority</p>
                        </div>
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
                  <p className="text-muted-foreground mb-4">Create the first deal for this company.</p>
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
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAddActivityModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </div>
            {companyActivities.length > 0 ? (
              <div className="space-y-3">
                {companyActivities.map((activity) => (
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
                  <p className="text-muted-foreground mb-4">Activities will appear here as you interact with this company.</p>
                  <Button onClick={() => setShowAddActivityModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EditCompanyModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        company={company}
      />
      
      <AddClientModal 
        open={showAddClientModal} 
        onOpenChange={setShowAddClientModal}
        defaultCompanyName={company.name}
      />
      
      <AddActivityModal
        open={showAddActivityModal}
        onOpenChange={setShowAddActivityModal}
        clients={companyClients.map(c => ({ id: c.id, name: c.contact_name, company: c.company_name || '' }))}
        deals={companyDeals.map(d => ({ id: d.id, title: d.title, client: { name: companyClients.find(c => c.id === d.client_id)?.contact_name || '' } }))}
      />
    </div>
  );
}