import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Clock, Paperclip } from "lucide-react";
import { logger } from "@/lib/utils/logger";

interface ComposeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  defaultSubject?: string;
}

export function ComposeEmailModal({
  open,
  onOpenChange,
  defaultTo = "",
  defaultSubject = "",
}: ComposeEmailModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    
    logger.userAction('email_send_attempt', 'anonymous', {
      recipient: to,
      subject,
      bodyLength: body.length,
      context: 'compose_email_modal'
    });
    
    // todo: remove mock functionality - integrate with Gmail API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSending(false);
    onOpenChange(false);
    setTo("");
    setSubject("");
    setBody("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="modal-compose-email">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              data-testid="input-email-to"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="input-email-subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message..."
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              data-testid="input-email-body"
            />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between gap-4 sm:justify-between">
          <Button variant="outline" size="icon" data-testid="button-attach-file">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" data-testid="button-schedule-send">
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button onClick={handleSend} disabled={isSending} data-testid="button-send-email">
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
