"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, CheckCircle2, Copy, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";

export default function SetupGuidePage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Database Setup Guide</h1>
        <p className="text-muted-foreground mt-2">
          Follow these steps to populate your database with sample data
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your database tables exist but are empty. Run the seed script to populate with sample data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Step 1: Access Supabase SQL Editor
          </CardTitle>
          <CardDescription>
            Open your Supabase project dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">1. Go to your Supabase Dashboard</span>
            <a
              href="https://supabase.com/dashboard/project/qmxevqdpbdixzvbciimm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
            >
              Open Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="text-sm">2. Navigate to <Badge variant="secondary">SQL Editor</Badge> in the left sidebar</div>
          <div className="text-sm">3. Click <Badge variant="secondary">New Query</Badge></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Step 2: Run the Seed Script
          </CardTitle>
          <CardDescription>
            This will populate your database with 15 clients, 18 deals, and sample activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Seed Script Location:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("database/seed.sql")}
              >
                <Copy className="h-3 w-3 mr-2" />
                {copied ? "Copied!" : "Copy Path"}
              </Button>
            </div>
            <code className="block bg-muted p-3 rounded-lg text-sm">
              /database/seed.sql
            </code>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The seed script automatically detects your user ID, so you don't need to modify anything!
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <span className="text-sm font-medium">Instructions:</span>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Open <code className="bg-background px-1 py-0.5 rounded">database/seed.sql</code> in your code editor</li>
              <li>Copy the entire contents of the file</li>
              <li>Paste it into the Supabase SQL Editor</li>
              <li>Click <Badge variant="secondary">Run</Badge> or press <kbd className="px-2 py-1 bg-background border rounded">Ctrl/Cmd + Enter</kbd></li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Step 3: Verify Data
          </CardTitle>
          <CardDescription>
            Check that the data was imported successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">After running the seed script, you should see:</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">15 Clients</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">18 Deals</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">30+ Activities</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">10 Meetings</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">To verify, navigate to these pages:</span>
            <div className="space-y-1">
              <Link href="/dashboard" className="text-sm text-primary hover:underline block">
                → Dashboard (should show metrics and recent activities)
              </Link>
              <Link href="/dashboard/clients" className="text-sm text-primary hover:underline block">
                → Clients (should show 15 clients)
              </Link>
              <Link href="/dashboard/pipeline" className="text-sm text-primary hover:underline block">
                → Pipeline (should show 18 deals across 6 stages)
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What the Seed Data Includes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">📊 Sample Clients (15 total)</h4>
              <p className="text-sm text-muted-foreground">
                Realistic client data with names, companies, contact info, and status (active/prospect/inactive)
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">💼 Sample Deals (18 total)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Distributed across all pipeline stages:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• 3 deals in Lead stage ($45,500 total)</li>
                <li>• 4 deals in Qualified stage ($170,000 total)</li>
                <li>• 3 deals in Proposal stage ($205,000 total)</li>
                <li>• 3 deals in Negotiation stage ($275,000 total)</li>
                <li>• 3 closed won deals ($141,000 total)</li>
                <li>• 2 closed lost deals ($179,000 total)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">📝 Sample Activities (30+ total)</h4>
              <p className="text-sm text-muted-foreground">
                Recent emails, calls, meetings, tasks, and notes linked to clients and deals
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">📅 Sample Meetings (10 total)</h4>
              <p className="text-sm text-muted-foreground">
                Upcoming and past meetings with clients, including video calls and in-person meetings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Need to reset the data?</strong> You can run the seed script multiple times. It will add new data each time.
          To start fresh, delete all rows from the tables in Supabase Table Editor first.
        </AlertDescription>
      </Alert>
    </div>
  );
}
