import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, MapPin, Plus } from "lucide-react";

export interface Meeting {
  id: string;
  title: string;
  attendee?: string;
  company?: string;
  date: string;
  time: string;
  duration: string;
  type: "video" | "in-person";
}

interface UpcomingMeetingsProps {
  meetings: Meeting[];
  onAddMeeting?: () => void;
  onJoinMeeting?: (meeting: Meeting) => void;
}

export function UpcomingMeetings({ meetings, onAddMeeting, onJoinMeeting }: UpcomingMeetingsProps) {
  return (
    <Card data-testid="upcoming-meetings-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Meetings
        </CardTitle>
        <Button size="sm" variant="outline" onClick={onAddMeeting} data-testid="button-add-meeting">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming meetings scheduled
          </p>
        ) : (
          meetings.map((meeting) => {
            const attendeeName = meeting.attendee || "Guest";
            const initials = attendeeName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={meeting.id}
                className="flex items-start gap-3 p-3 rounded-md bg-muted/50 hover-elevate"
                data-testid={`meeting-item-${meeting.id}`}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{meeting.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {attendeeName}{meeting.company ? ` - ${meeting.company}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {meeting.time} ({meeting.duration})
                    </span>
                    <span className="flex items-center gap-1">
                      {meeting.type === "video" ? (
                        <Video className="h-3 w-3" />
                      ) : (
                        <MapPin className="h-3 w-3" />
                      )}
                      {meeting.type === "video" ? "Video call" : "In-person"}
                    </span>
                  </div>
                </div>
                {meeting.type === "video" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onJoinMeeting?.(meeting)}
                    data-testid={`button-join-meeting-${meeting.id}`}
                  >
                    Join
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
