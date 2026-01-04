'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Download, 
  AlertTriangle,
  Eye,
  EyeOff,
  Key,
  Smartphone,
} from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/hooks/use-toast';
import type { TwoFactorStatus } from '@/lib/security/two-factor-auth';

interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function TwoFactorAuth({ className }: { className?: string }) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Setup state
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState<'generate' | 'verify' | 'complete'>('generate');
  
  // Disable state
  const [disableOpen, setDisableOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch 2FA status');
      }

      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      logger.error('Failed to fetch 2FA status', {
        action: '2fa_status_fetch_failed',
        error: error as Error,
      });
      toast({
        title: 'Error',
        description: 'Failed to load 2FA status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setSetupData(data.data);
      setSetupStep('verify');
      setSetupOpen(true);
    } catch (error) {
      logger.error('Failed to start 2FA setup', {
        action: '2fa_setup_start_failed',
        error: error as Error,
      });
      toast({
        title: 'Error',
        description: 'Failed to start 2FA setup',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setSetupStep('complete');
      await fetchStatus();
      
      toast({
        title: 'Success',
        description: '2FA has been successfully enabled',
      });
    } catch (error) {
      logger.error('Failed to verify 2FA setup', {
        action: '2fa_setup_verify_failed',
        error: error as Error,
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify 2FA',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!password) {
      toast({
        title: 'Error',
        description: 'Password is required to disable 2FA',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setDisableOpen(false);
      setPassword('');
      await fetchStatus();
      
      toast({
        title: 'Success',
        description: '2FA has been disabled',
      });
    } catch (error) {
      logger.error('Failed to disable 2FA', {
        action: '2fa_disable_failed',
        error: error as Error,
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to disable 2FA',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = `SalesFlow CRM - Two-Factor Authentication Backup Codes

IMPORTANT: Save these backup codes in a secure location. Each code can only be used once.

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Generated: ${new Date().toLocaleString()}

Keep these codes secure and accessible. You can use them to regain access to your account if you lose your authenticator device.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'salesflow-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const closeSetupDialog = () => {
    setSetupOpen(false);
    setSetupData(null);
    setVerificationCode('');
    setSetupStep('generate');
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
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
            Two-Factor Authentication
          </CardTitle>
          {status?.isEnabled ? (
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary">
              Disabled
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security to your account with time-based one-time passwords
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {status?.isEnabled ? (
          <div className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is active. Your account is protected with TOTP codes.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="text-sm space-y-1">
                <p>✅ 2FA is enabled and active</p>
                <p>📱 Backup codes remaining: {status.backupCodesRemaining || 0}</p>
                {status.lastUsed && (
                  <p>🕒 Last used: {new Date(status.lastUsed).toLocaleString()}</p>
                )}
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={actionLoading}>
                  Disable 2FA
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the extra security layer from your account. 
                    Enter your password to confirm this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="disable-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="disable-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setPassword('')}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={disable2FA}
                    disabled={actionLoading || !password}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {actionLoading ? 'Disabling...' : 'Disable 2FA'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your account is not protected by two-factor authentication. 
                We strongly recommend enabling 2FA for enhanced security.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Benefits of 2FA</Label>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Protects against password breaches</li>
                <li>• Prevents unauthorized access</li>
                <li>• Works with popular authenticator apps</li>
                <li>• Includes backup codes for recovery</li>
              </ul>
            </div>

            <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
              <DialogTrigger asChild>
                <Button onClick={startSetup} disabled={actionLoading}>
                  <Key className="h-4 w-4 mr-2" />
                  Enable 2FA
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    {setupStep === 'verify' && 'Scan the QR code and enter the verification code'}
                    {setupStep === 'complete' && '2FA has been successfully enabled'}
                  </DialogDescription>
                </DialogHeader>

                {setupStep === 'verify' && setupData && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Step 1: Scan QR Code</Label>
                      <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
                        <QrCode className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          Scan this QR code with your authenticator app
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(setupData.qrCodeUrl)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Setup URL
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Step 2: Manual Entry (Alternative)</Label>
                      <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                        {setupData.secret}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(setupData.secret)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Secret
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verification-code">Step 3: Enter Verification Code</Label>
                      <Input
                        id="verification-code"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center font-mono text-lg tracking-widest"
                      />
                    </div>
                  </div>
                )}

                {setupStep === 'complete' && setupData && (
                  <div className="space-y-4">
                    <Alert>
                      <ShieldCheck className="h-4 w-4" />
                      <AlertDescription>
                        2FA has been successfully enabled for your account.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Backup Codes</Label>
                      <p className="text-xs text-muted-foreground">
                        Save these backup codes in a secure location. Each code can only be used once.
                      </p>
                      <div className="grid grid-cols-2 gap-1 p-3 bg-muted rounded font-mono text-xs">
                        {setupData.backupCodes.map((code, index) => (
                          <div key={index}>{code}</div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Codes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadBackupCodes}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {setupStep === 'verify' && (
                    <>
                      <Button variant="outline" onClick={closeSetupDialog}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={verifySetup}
                        disabled={actionLoading || verificationCode.length !== 6}
                      >
                        {actionLoading ? 'Verifying...' : 'Verify & Enable'}
                      </Button>
                    </>
                  )}
                  {setupStep === 'complete' && (
                    <Button onClick={closeSetupDialog}>
                      Done
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label>Recommended Authenticator Apps</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Google Authenticator
            </div>
            <div className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Authy
            </div>
            <div className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Microsoft Authenticator
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}