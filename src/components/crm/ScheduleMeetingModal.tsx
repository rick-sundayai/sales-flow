import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateMeeting } from "@/lib/queries/meetings";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ScheduleMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAttendee?: string;
  clients?: { id: string; name: string; company: string }[];
}

export function ScheduleMeetingModal({
  open,
  onOpenChange,
  defaultAttendee = "",
  clients = [],
}: ScheduleMeetingModalProps) {
  const { user } = useAuth();
  const createMeeting = useCreateMeeting();
  
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [type, setType] = useState("video");
  const [attendees, setAttendees] = useState(defaultAttendee);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const handleSchedule = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to schedule a meeting.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !date || !time) {
      toast({
        title: "Validation Error",
        description: "Title, date, and time are required.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time into a proper datetime
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

    if (startDateTime <= new Date()) {
      toast({
        title: "Validation Error", 
        description: "Meeting must be scheduled for a future date and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMeeting.mutateAsync({
        user_id: user.id,
        client_id: clientId || null,
        title: title.trim(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        meeting_type: type as 'in-person' | 'video' | 'phone',
        location: location.trim() || null,
        attendees: attendees.split(',').map(email => email.trim()).filter(Boolean),
        status: 'scheduled',
        notes: notes.trim() || null,
      });

      toast({
        title: "Success",
        description: "Meeting has been scheduled successfully.",
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating meeting:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Extract more specific error message if available
      let errorMessage = "Failed to schedule meeting. Please try again.";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message || errorMessage;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setClientId("");
    setDate("");
    setTime("");
    setDuration("30");
    setType("video");
    setAttendees(defaultAttendee);
    setLocation("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-schedule-meeting">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="e.g., Product Demo Call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-meeting-title"
            />
          </div>

          {clients.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger data-testid="select-meeting-client">
                  <SelectValue placeholder="Select a client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-meeting-date"
                className="dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                data-testid="input-meeting-time"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger data-testid="select-meeting-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Meeting Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-meeting-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendees
            </Label>
            <Input
              id="attendees"
              placeholder="Enter email addresses, separated by commas"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              data-testid="input-meeting-attendees"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Google Meet, Zoom, or address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              data-testid="input-meeting-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any meeting notes or agenda items..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-meeting-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-meeting">
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={createMeeting.isPending || !title.trim() || !date || !time} data-testid="button-schedule-meeting">
            {createMeeting.isPending ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Scheduling...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Meeting
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
