'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { geminiService, type EmailDraft } from '@/lib/services/gemini-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Sparkles, 
  Copy, 
  Send, 
  RefreshCw, 
  Loader2, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AIEmailComposerProps {
  dealData?: {
    title: string;
    stage: string;
    client: {
      contact_name: string;
      company_name?: string;
      email?: string;
    };
  };
  onSendEmail?: (email: { to: string; subject: string; body: string }) => void;
}

export function AIEmailComposer({ dealData, onSendEmail }: AIEmailComposerProps) {
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [emailPurpose, setEmailPurpose] = useState<'follow-up' | 'proposal' | 'closing' | 'check-in' | 'introduction'>('follow-up');
  const [recipientName, setRecipientName] = useState(dealData?.client.contact_name || '');
  const [recipientEmail, setRecipientEmail] = useState(dealData?.client.email || '');
  const [copied, setCopied] = useState(false);

  const generateEmailMutation = useMutation({
    mutationFn: () => {
      if (!dealData || !recipientName) {
        throw new Error('Missing required data');
      }
      
      return geminiService.generateEmailDraft({
        dealTitle: dealData.title,
        dealStage: dealData.stage,
        clientName: recipientName,
        companyName: dealData.client.company_name,
        purpose: emailPurpose,
        customInstructions: customInstructions || undefined
      });
    },
    onSuccess: (data) => {
      setEmailDraft(data);
    },
    onError: (error) => {
      console.error('Email generation failed:', error);
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendEmail = () => {
    if (emailDraft && recipientEmail && onSendEmail) {
      onSendEmail({
        to: recipientEmail,
        subject: emailDraft.subject,
        body: emailDraft.body
      });
    }
  };

  const getPurposeDescription = (purpose: string) => {
    switch (purpose) {
      case 'follow-up': return 'Continue conversation after meeting or call';
      case 'proposal': return 'Send proposal or quote details';
      case 'closing': return 'Push for decision or next steps';
      case 'check-in': return 'Regular touch-base or status update';
      case 'introduction': return 'Initial outreach or introduction';
      default: return '';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'friendly': return 'bg-green-100 text-green-800';
      case 'formal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">AI Email Composer</CardTitle>
        </div>
        <CardDescription>
          Generate contextual emails powered by AI for your deals and clients
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-name">Recipient Name</Label>
            <Input
              id="recipient-name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Enter recipient name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-purpose">Email Purpose</Label>
          <Select value={emailPurpose} onValueChange={(value: any) => setEmailPurpose(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select email purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="introduction">Introduction</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="check-in">Check-in</SelectItem>
              <SelectItem value="closing">Closing</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {getPurposeDescription(emailPurpose)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
          <Textarea
            id="custom-instructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add specific instructions for the email content..."
            rows={2}
          />
        </div>

        {/* Generate Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => generateEmailMutation.mutate()}
            disabled={generateEmailMutation.isPending || !dealData || !recipientName}
            className="flex-1"
          >
            {generateEmailMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>
          {emailDraft && (
            <Button
              onClick={() => generateEmailMutation.mutate()}
              variant="outline"
              disabled={generateEmailMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Error State */}
        {generateEmailMutation.isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to generate email. Please check your configuration and try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Generated Email */}
        {emailDraft && (
          <div className="space-y-4">
            <Separator />
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Email</h3>
              <Badge className={getToneColor(emailDraft.tone)}>
                {emailDraft.tone}
              </Badge>
            </div>

            {/* Subject Line */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Subject</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(emailDraft.subject)}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">{emailDraft.subject}</p>
              </div>
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Message</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(emailDraft.body)}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {emailDraft.body}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSendEmail}
                disabled={!recipientEmail || !onSendEmail}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!emailDraft && !generateEmailMutation.isPending && !generateEmailMutation.isError && (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Configure your email settings and click "Generate Email"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}