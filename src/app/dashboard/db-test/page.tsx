"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { testDatabaseConnection } from "@/lib/supabase/test-connection";

export default function DatabaseTestPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const testResult = await testDatabaseConnection();
      setResult(testResult);
    } catch (error) {
      setResult({
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Database Connection Test</h1>
        <p className="text-muted-foreground mt-2">
          Test your Supabase database connection and verify schema setup
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Click the button below to test your database connection and check which tables exist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTest} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Test Database Connection
              </>
            )}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                {result.connected ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {result.connected ? "Connected to Supabase" : "Connection Failed"}
                </span>
              </div>

              {result.user && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Logged in as: </span>
                  <span className="font-medium">{result.user}</span>
                </div>
              )}

              {result.error && (
                <div className="text-sm text-red-500">
                  <span className="font-semibold">Error: </span>
                  {result.error}
                </div>
              )}

              {result.tables && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Database Tables:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(result.tables).map(([table, exists]) => (
                      <div key={table} className="flex items-center gap-2">
                        {exists ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{table}</span>
                        <Badge variant={exists ? "default" : "destructive"} className="ml-auto">
                          {exists ? "exists" : "missing"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg text-sm space-y-2">
            <h3 className="font-semibold">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>If tables are missing, run <code className="bg-background px-1 py-0.5 rounded">database/setup.sql</code> in Supabase SQL Editor</li>
              <li>Then run <code className="bg-background px-1 py-0.5 rounded">database/crm-schema.sql</code> in Supabase SQL Editor</li>
              <li>Optionally run <code className="bg-background px-1 py-0.5 rounded">database/seed.sql</code> for test data</li>
              <li>Refresh this page and test again</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Schema Files</CardTitle>
          <CardDescription>
            SQL files located in the <code>/database</code> directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm"><code>database/setup.sql</code> - Authentication and user profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm"><code>database/crm-schema.sql</code> - CRM tables (clients, deals, activities, etc.)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm"><code>database/seed.sql</code> - Sample data for testing</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
