"use client";

import { Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
        <p className="text-muted-foreground mt-2">
          Automate your workflows with n8n
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Workflow Automation
          </CardTitle>
          <CardDescription>
            This feature is coming soon. n8n webhook integration will be added as part of Phase 6.3 of the migration plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              We're working on integrating n8n webhooks to enable powerful workflow automation.
              Trigger actions based on CRM events!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
