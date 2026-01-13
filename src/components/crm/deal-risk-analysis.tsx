'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { analyzeDealRisks, type DealRiskAnalysis } from '@/lib/services/gemini-service-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Loader2
} from 'lucide-react';

interface DealRiskAnalysisProps {
  dealData: {
    id: string;
    title: string;
    value: number;
    stage: string;
    probability: number;
    client: {
      contact_name: string;
      company_name?: string;
      status: string;
    };
    activities: Array<{
      type: string;
      title: string;
      description?: string;
      completed: boolean;
      created_at: string;
    }>;
  };
}

export function DealRiskAnalysisComponent({ dealData }: DealRiskAnalysisProps) {
  const [analysis, setAnalysis] = useState<DealRiskAnalysis | null>(null);

  const analyzeRiskMutation = useMutation({
    mutationFn: () => analyzeDealRisks(dealData.id),
    onSuccess: (data) => {
      setAnalysis(data);
    },
    onError: (error) => {
      console.error('Risk analysis failed:', error);
    }
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Minus className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Risk Analysis</CardTitle>
          </div>
          <Button
            onClick={() => analyzeRiskMutation.mutate()}
            disabled={analyzeRiskMutation.isPending}
            size="sm"
            variant="outline"
          >
            {analyzeRiskMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Deal
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Get AI-powered insights about potential deal risks and recommended actions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {analyzeRiskMutation.isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to analyze deal risks. Please check your API configuration and try again.
            </AlertDescription>
          </Alert>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Risk Level */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Risk Level:</span>
                <Badge className={`${getRiskColor(analysis.riskLevel)} flex items-center gap-1`}>
                  {getRiskIcon(analysis.riskLevel)}
                  {analysis.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Confidence:</span>
                <span className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                  {analysis.confidence}%
                </span>
              </div>
            </div>

            <Separator />

            {/* Risk Factors */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Risk Factors
              </h4>
              <ul className="space-y-1">
                {analysis.riskFactors.map((factor, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Next Best Action */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                Recommended Action
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">{analysis.nextBestAction}</p>
              </div>
            </div>

            {/* Deal Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${dealData.value.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Deal Value</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {dealData.probability}%
                </div>
                <div className="text-sm text-muted-foreground">Win Probability</div>
              </div>
            </div>
          </div>
        )}

        {!analysis && !analyzeRiskMutation.isPending && !analyzeRiskMutation.isError && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click "Analyze Deal" to get AI-powered risk insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}