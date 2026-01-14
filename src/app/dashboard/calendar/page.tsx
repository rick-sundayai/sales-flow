"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { generateContent } from "@/lib/services/gemini-service-client";
import { useClients } from "@/lib/queries/clients";
import { useDeals } from "@/lib/queries/deals";
import { SearchBar } from "@/components/crm/SearchBar";
import { ScheduleMeetingModal } from "@/components/crm/ScheduleMeetingModal";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Plus,
  Brain,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
  Phone,
  Mail
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'video' | 'phone' | 'in-person';
  location?: string;
  attendees: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  clientId?: string;
  dealId?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

interface MeetingPrep {
  keyPoints: string[];
  objectives: string[];
  potentialChallenges: string[];
  suggestedQuestions: string[];
  successMetrics: string[];
  followUpActions: string[];
}

interface SchedulingSuggestion {
  suggestedTime: string;
  reasoning: string;
  alternativeTimes: string[];
  conflictWarnings?: string[];
}

// TODO: Replace with actual meeting data from Supabase

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const { data: clients = [] } = useClients();
  const { data: deals = [] } = useDeals();
  
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [meetingPrep, setMeetingPrep] = useState<MeetingPrep | null>(null);
  const [schedulingSuggestion, setSchedulingSuggestion] = useState<SchedulingSuggestion | null>(null);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);

  // TODO: Replace with actual meeting data from Supabase
  const meetings: Meeting[] = useMemo(() => [], []);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      const matchesSearch =
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.attendees.some(attendee => attendee.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'upcoming' && meeting.status === 'scheduled' && meeting.startTime > new Date()) ||
        (selectedFilter === 'today' && isToday(meeting.startTime)) ||
        (selectedFilter === 'high-priority' && meeting.priority === 'high');

      return matchesSearch && matchesFilter;
    });
  }, [meetings, searchQuery, selectedFilter]);

  const generateMeetingPrepMutation = useMutation({
    mutationFn: async (meeting: Meeting) => {
      const client = clients.find(c => c.id === meeting.clientId);
      const deal = deals.find(d => d.id === meeting.dealId);

      const prompt = `Generate comprehensive meeting preparation for this upcoming meeting:

Meeting: ${meeting.title}
Description: ${meeting.description}
Type: ${meeting.type}
Priority: ${meeting.priority}
Tags: ${meeting.tags.join(', ')}
Attendees: ${meeting.attendees.join(', ')}

${client ? `Client Information:
- Name: ${client.contact_name}
- Company: ${client.company_name || 'N/A'}
- Email: ${client.email}
- Phone: ${client.phone || 'N/A'}
` : ''}

${deal ? `Related Deal:
- Title: ${deal.title}
- Value: $${deal.value}
- Stage: ${deal.stage}
- Probability: ${deal.probability}%
- Close Date: ${deal.close_date}
` : ''}

Please provide meeting preparation in JSON format with the following structure:
{
  "keyPoints": ["key point 1", "key point 2"],
  "objectives": ["objective 1", "objective 2"],
  "potentialChallenges": ["challenge 1", "challenge 2"],
  "suggestedQuestions": ["question 1", "question 2"],
  "successMetrics": ["metric 1", "metric 2"],
  "followUpActions": ["action 1", "action 2"]
}

Focus on actionable insights and specific recommendations.`;

      const result = await generateContent({ prompt, type: 'meeting-prep' });

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate meeting prep');
      }

      return result.data as MeetingPrep;
    },
    onSuccess: (data) => {
      setMeetingPrep(data);
    }
  });

  const generateSchedulingSuggestionMutation = useMutation({
    mutationFn: async (meetingDetails: { title: string; type: string; duration: number; attendees: string[] }) => {
      const prompt = `Generate smart scheduling suggestions for this meeting:

Meeting: ${meetingDetails.title}
Type: ${meetingDetails.type}
Duration: ${meetingDetails.duration} minutes
Attendees: ${meetingDetails.attendees.join(', ')}

Current time: ${new Date().toISOString()}
Existing meetings: ${JSON.stringify(meetings.map(m => ({ title: m.title, start: m.startTime, end: m.endTime })))}

Consider:
- Optimal meeting times based on productivity patterns
- Time zone considerations for attendees
- Potential scheduling conflicts
- Meeting type requirements (video setup time, travel time, etc.)
- Best practices for meeting timing

Please provide scheduling suggestions in JSON format:
{
  "suggestedTime": "specific time recommendation",
  "reasoning": "explanation for the suggestion",
  "alternativeTimes": ["alternative 1", "alternative 2", "alternative 3"],
  "conflictWarnings": ["potential conflict 1", "potential conflict 2"]
}`;

      const result = await generateContent({ prompt, type: 'scheduling-suggestion' });

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate scheduling suggestion');
      }

      return result.data as SchedulingSuggestion;
    },
    onSuccess: (data) => {
      setSchedulingSuggestion(data);
    }
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in-person': return <MapPin className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 space-y-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AI-Powered Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Smart scheduling with AI meeting preparation and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => generateSchedulingSuggestionMutation.mutate({
              title: 'New Meeting',
              type: 'video',
              duration: 60,
              attendees: ['example@company.com']
            })} className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Schedule
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowNewMeetingModal(true)}>
              <Plus className="h-4 w-4" />
              New Meeting
            </Button>
          </div>
        </div>
        <SearchBar
          placeholder="Search meetings by title, attendees, or description..."
          onSearch={setSearchQuery}
          showFilters={false}
        />
      </div>

      <div className="flex-1 flex">
        <div className="w-64 border-r border-border p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Filters</h3>
            <div className="space-y-1">
              {[
                { key: 'all', label: 'All Meetings', count: meetings.length },
                { key: 'upcoming', label: 'Upcoming', count: meetings.filter(m => m.status === 'scheduled' && m.startTime > new Date()).length },
                { key: 'today', label: 'Today', count: meetings.filter(m => isToday(m.startTime)).length },
                { key: 'high-priority', label: 'High Priority', count: meetings.filter(m => m.priority === 'high').length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                  className={`w-full text-left px-2 py-1 rounded-md text-sm transition-colors flex items-center justify-between ${
                    selectedFilter === filter.key ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <span>{filter.label}</span>
                  <Badge variant="secondary" className="text-xs">{filter.count}</Badge>
                </button>
              ))}
            </div>
          </div>

          {schedulingSuggestion && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-green-600" />
                  AI Scheduling Suggestion
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Best Time:</strong>
                    <p className="text-muted-foreground">{schedulingSuggestion.suggestedTime}</p>
                  </div>
                  <div>
                    <strong>Why:</strong>
                    <p className="text-muted-foreground">{schedulingSuggestion.reasoning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex-1 flex">
          <div className="w-1/2 border-r border-border">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">
                Meetings
                <span className="text-muted-foreground ml-2">({filteredMeetings.length})</span>
              </h2>
            </div>
            <div className="divide-y divide-border">
              {filteredMeetings.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No Meetings Scheduled</h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule your first meeting to get started.
                  </p>
                </div>
              ) : (
                filteredMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors border-l-4 ${
                    selectedMeeting?.id === meeting.id ? 'bg-accent' : ''
                  } ${getPriorityColor(meeting.priority)}`}
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{meeting.title}</h3>
                      <Badge variant={meeting.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs">
                        {meeting.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(meeting.startTime)} at {formatTime(meeting.startTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getMeetingTypeIcon(meeting.type)}
                      <span>{meeting.type}</span>
                      {meeting.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{meeting.location}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{meeting.attendees.length} attendees</span>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-xs text-muted-foreground truncate">{meeting.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {meeting.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </div>

          <div className="w-1/2">
            {selectedMeeting ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{selectedMeeting.title}</h2>
                    <Button
                      onClick={() => generateMeetingPrepMutation.mutate(selectedMeeting)}
                      disabled={generateMeetingPrepMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      {generateMeetingPrepMutation.isPending ? 'Generating...' : 'AI Prep'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div><strong>Time:</strong> {formatDate(selectedMeeting.startTime)} at {formatTime(selectedMeeting.startTime)} - {formatTime(selectedMeeting.endTime)}</div>
                    <div><strong>Type:</strong> {selectedMeeting.type}</div>
                    {selectedMeeting.location && <div><strong>Location:</strong> {selectedMeeting.location}</div>}
                    <div><strong>Attendees:</strong> {selectedMeeting.attendees.join(', ')}</div>
                    <div><strong>Priority:</strong> 
                      <Badge className={`ml-2 ${
                        selectedMeeting.priority === 'high' ? 'bg-red-100 text-red-800' :
                        selectedMeeting.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedMeeting.priority}
                      </Badge>
                    </div>
                    {selectedMeeting.description && (
                      <div><strong>Description:</strong> {selectedMeeting.description}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  {meetingPrep ? (
                    <Tabs defaultValue="prep" className="h-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="prep">Meeting Prep</TabsTrigger>
                        <TabsTrigger value="objectives">Objectives</TabsTrigger>
                        <TabsTrigger value="followup">Follow-up</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="prep" className="space-y-4 mt-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4" /> Key Points
                          </h4>
                          <ul className="space-y-1">
                            {meetingPrep.keyPoints.map((point, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Potential Challenges
                          </h4>
                          <ul className="space-y-1">
                            {meetingPrep.potentialChallenges.map((challenge, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <AlertCircle className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Suggested Questions</h4>
                          <ul className="space-y-1">
                            {meetingPrep.suggestedQuestions.map((question, index) => (
                              <li key={index} className="text-sm text-muted-foreground">• {question}</li>
                            ))}
                          </ul>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="objectives" className="space-y-4 mt-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Meeting Objectives
                          </h4>
                          <ul className="space-y-1">
                            {meetingPrep.objectives.map((objective, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <Star className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Success Metrics</h4>
                          <ul className="space-y-1">
                            {meetingPrep.successMetrics.map((metric, index) => (
                              <li key={index} className="text-sm text-muted-foreground">• {metric}</li>
                            ))}
                          </ul>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="followup" className="space-y-4 mt-4">
                        <div>
                          <h4 className="font-medium mb-2">Recommended Follow-up Actions</h4>
                          <ul className="space-y-1">
                            {meetingPrep.followUpActions.map((action, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <Mail className="h-3 w-3 mt-0.5 text-purple-500 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">AI Meeting Preparation</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click &quot;AI Prep&quot; to generate intelligent meeting preparation insights
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Select a Meeting</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a meeting from the list to view details and AI insights
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal open={showNewMeetingModal} onOpenChange={setShowNewMeetingModal} />
    </div>
  );
}
