'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useSessionManager } from '@/lib/security/session-manager';
import { Monitor, Smartphone, Shield, Clock, MapPin, LogOut } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface SessionData {
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  userAgent?: string;
  ipAddress?: string;
}

export function SessionManager({ className }: { className?: string }) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { endSession, endAllSessions } = useSessionManager();

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/session/list', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      logger.error('Failed to fetch sessions', {
        action: 'session_fetch_failed',
        error: error as Error,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndAllSessions = async () => {
    setActionLoading(true);
    try {
      await endAllSessions();
      await fetchSessions();
    } catch (error) {
      logger.error('Failed to end all sessions', {
        action: 'session_end_all_failed',
        error: error as Error,
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    
    return <Monitor className="h-4 w-4" />;
  };

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Browser';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Unknown Browser';
  };

  const isCurrentSession = (sessionId: string) => {
    // In a real implementation, you'd get the current session ID from cookies
    // For now, assume the first session is the current one
    return sessions.indexOf(sessions.find(s => s.sessionId === sessionId)!) === 0;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Management
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={actionLoading || sessions.length === 0}
              >
                <LogOut className="h-4 w-4 mr-2" />
                End All Sessions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End All Sessions</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end all active sessions on all devices. You will need to sign in again on all devices. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleEndAllSessions}
                  disabled={actionLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {actionLoading ? 'Ending Sessions...' : 'End All Sessions'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your active sessions across all devices. For security, end sessions on devices you no longer use.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active sessions found
          </div>
        ) : (
          sessions.map((session, index) => (
            <div
              key={session.sessionId}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getDeviceIcon(session.userAgent)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getBrowserInfo(session.userAgent)}
                    </span>
                    {isCurrentSession(session.sessionId) && (
                      <Badge variant="secondary" className="text-xs">
                        Current Session
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Last activity: {formatDate(session.lastActivity)}</span>
                    </div>
                    {session.ipAddress && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{session.ipAddress}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Started: {formatDate(session.createdAt)}
                  </div>
                </div>
              </div>
              {!isCurrentSession(session.sessionId) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // In a real implementation, you'd end the specific session
                    // For now, we'll just refresh the list
                    fetchSessions();
                  }}
                  disabled={actionLoading}
                >
                  End Session
                </Button>
              )}
            </div>
          ))
        )}
        
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Security Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Sessions automatically expire after 24 hours of inactivity</li>
            <li>• You can have up to 5 active sessions at once</li>
            <li>• End sessions on shared or public computers</li>
            <li>• If you notice suspicious activity, end all sessions immediately</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}