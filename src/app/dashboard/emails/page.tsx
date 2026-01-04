"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIEmailComposer } from "@/components/crm/ai-email-composer";
import { ComposeEmailModal } from "@/components/crm/ComposeEmailModal";
import { SearchBar } from "@/components/crm/SearchBar";
import { 
  Mail, 
  Send, 
  Inbox, 
  Archive, 
  Star, 
  Trash2, 
  Reply, 
  Forward, 
  MoreHorizontal,
  Sparkles,
  Brain,
  Plus,
  Paperclip,
  Clock,
  User
} from "lucide-react";
import { useClients } from "@/lib/queries/clients";
import { useDeals } from "@/lib/queries/deals";
import { logger } from "@/lib/utils/logger";

// Mock email data - would be replaced with actual Gmail integration
interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
  threadId?: string;
}

const MOCK_EMAILS: EmailMessage[] = [
  {
    id: '1',
    from: 'john.doe@acmecorp.com',
    to: ['you@company.com'],
    subject: 'Re: Software License Proposal',
    body: 'Hi, thanks for the proposal. We would like to discuss the pricing options for the enterprise package. Could we schedule a call this week?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    isStarred: true,
    hasAttachments: false,
    labels: ['prospect', 'high-priority']
  },
  {
    id: '2',
    from: 'sarah.wilson@techstart.io',
    to: ['you@company.com'],
    subject: 'Follow-up on Demo Meeting',
    body: 'Thank you for the demo yesterday. Our team was impressed with the features. We have a few questions about the implementation timeline.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    labels: ['follow-up', 'demo']
  },
  {
    id: '3',
    from: 'mike.chen@globaltech.com',
    to: ['you@company.com'],
    cc: ['team@globaltech.com'],
    subject: 'Contract Review Complete',
    body: 'The legal team has completed their review of the contract. We are ready to proceed with the next steps.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    labels: ['contract', 'ready-to-close']
  }
];

export default function EmailsPage() {
  const { user, loading } = useAuth();
  const { data: clients = [] } = useClients();
  
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("all");
  const [activeTab, setActiveTab] = useState("inbox");
  const [showComposer, setShowComposer] = useState(false);
  const [showRegularComposer, setShowRegularComposer] = useState(false);

  const filteredEmails = useMemo(() => {
    return MOCK_EMAILS.filter(email => {
      const matchesSearch = 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLabel = selectedLabel === 'all' || email.labels.includes(selectedLabel);
      
      return matchesSearch && matchesLabel;
    });
  }, [searchQuery, selectedLabel]);

  const unreadCount = MOCK_EMAILS.filter(email => !email.isRead).length;
  const starredCount = MOCK_EMAILS.filter(email => email.isStarred).length;

  const allLabels = [...new Set(MOCK_EMAILS.flatMap(email => email.labels))];

  const handleSendEmail = (email: { to: string; subject: string; body: string }) => {
    logger.userAction('email_compose', user?.id || 'anonymous', {
      recipient: email.to,
      subject: email.subject,
      bodyLength: email.body.length,
      context: 'emails_page'
    });
    // TODO: Integrate with actual email service
    setShowComposer(false);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
    return timestamp.toLocaleDateString();
  };

  const findClientByEmail = (email: string) => {
    return clients.find(client => client.email === email);
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
      {/* Header */}
      <div className="p-6 pb-4 space-y-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Emails</h1>
            <p className="text-muted-foreground mt-1">
              Manage your email communications with AI assistance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowComposer(true)} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Compose
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowRegularComposer(true)}>
              <Plus className="h-4 w-4" />
              New Email
            </Button>
          </div>
        </div>
        <SearchBar
          placeholder="Search emails by subject, sender, or content..."
          onSearch={setSearchQuery}
          showFilters={false}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-border p-4 space-y-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === "inbox" ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Inbox className="h-4 w-4" />
              <span className="flex-1 text-left">Inbox</span>
              {unreadCount > 0 && <Badge variant={activeTab === "inbox" ? "outline" : "secondary"} className="text-xs">{unreadCount}</Badge>}
            </button>
            <button
              onClick={() => setActiveTab("starred")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === "starred" ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Star className="h-4 w-4" />
              <span className="flex-1 text-left">Starred</span>
              {starredCount > 0 && <Badge variant={activeTab === "starred" ? "outline" : "secondary"} className="text-xs">{starredCount}</Badge>}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === "sent" ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Send className="h-4 w-4" />
              <span className="flex-1 text-left">Sent</span>
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === "archive" ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Archive className="h-4 w-4" />
              <span className="flex-1 text-left">Archive</span>
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Labels</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedLabel('all')}
                className={`w-full text-left px-2 py-1 rounded-md text-sm transition-colors ${
                  selectedLabel === 'all' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                }`}
              >
                All emails
              </button>
              {allLabels.map(label => (
                <button
                  key={label}
                  onClick={() => setSelectedLabel(label)}
                  className={`w-full text-left px-2 py-1 rounded-md text-sm transition-colors ${
                    selectedLabel === label ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  {label.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 flex">
          <div className="w-1/2 border-r border-border">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">
                {activeTab === 'inbox' ? 'Inbox' : 
                 activeTab === 'starred' ? 'Starred' :
                 activeTab === 'sent' ? 'Sent' : 'Archive'}
                <span className="text-muted-foreground ml-2">({filteredEmails.length})</span>
              </h2>
            </div>
            <div className="divide-y divide-border">
              {filteredEmails.map(email => {
                const client = findClientByEmail(email.from);
                return (
                  <div
                    key={email.id}
                    className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-accent' : ''
                    } ${!email.isRead ? 'border-l-2 border-l-blue-500' : ''}`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {client ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-sm">{client.contact_name}</span>
                              <Badge variant="outline" className="text-xs">Client</Badge>
                            </div>
                          ) : (
                            <span className="font-medium text-sm">{email.from}</span>
                          )}
                          {email.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          {email.hasAttachments && <Paperclip className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <h3 className={`text-sm truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                          {email.subject}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {email.body}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(email.timestamp)}
                          </span>
                          {email.labels.slice(0, 2).map(label => (
                            <Badge key={label} variant="secondary" className="text-xs">
                              {label.replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Content */}
          <div className="w-1/2">
            {selectedEmail ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Reply className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Forward className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div><strong>From:</strong> {selectedEmail.from}</div>
                    <div><strong>To:</strong> {selectedEmail.to.join(', ')}</div>
                    {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                      <div><strong>CC:</strong> {selectedEmail.cc.join(', ')}</div>
                    )}
                    <div><strong>Date:</strong> {selectedEmail.timestamp.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <div className="prose prose-sm max-w-none">
                    {selectedEmail.body}
                  </div>
                </div>

                <div className="p-4 border-t border-border">
                  <Button onClick={() => setShowComposer(true)} className="w-full">
                    <Brain className="h-4 w-4 mr-2" />
                    Reply with AI Assistance
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Select an Email</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose an email from the list to view its content
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Email Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">AI Email Composer</h2>
                <Button variant="ghost" onClick={() => setShowComposer(false)}>
                  ×
                </Button>
              </div>
              <AIEmailComposer
                dealData={selectedEmail ? {
                  title: `Reply to ${selectedEmail.subject}`,
                  stage: 'follow-up',
                  client: {
                    contact_name: selectedEmail.from.split('@')[0],
                    email: selectedEmail.from,
                  }
                } : undefined}
                onSendEmail={handleSendEmail}
              />
            </div>
          </div>
        </div>
      )}

      {/* Regular Email Composer Modal */}
      <ComposeEmailModal open={showRegularComposer} onOpenChange={setShowRegularComposer} />
    </div>
  );
}
