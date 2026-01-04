'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  validatePassword, 
  getPasswordStrengthDescription, 
  DEFAULT_PASSWORD_POLICY,
  type PasswordPolicy 
} from '@/lib/security/password-validation';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  policy?: PasswordPolicy;
  personalInfo?: string[];
  showSuggestions?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  policy = DEFAULT_PASSWORD_POLICY,
  personalInfo = [],
  showSuggestions = true,
  className,
}: PasswordStrengthIndicatorProps) {
  const [validation, setValidation] = useState(() => 
    validatePassword(password, policy, personalInfo)
  );

  useEffect(() => {
    setValidation(validatePassword(password, policy, personalInfo));
  }, [password, policy, personalInfo]);

  const strengthInfo = getPasswordStrengthDescription(validation.score);

  if (!password) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        {/* Strength indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Password Strength</span>
            <Badge 
              variant="outline" 
              className={strengthInfo.color}
            >
              {strengthInfo.label}
            </Badge>
          </div>
          <Progress value={validation.score} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {strengthInfo.description}
          </p>
        </div>

        {/* Requirements checklist */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Requirements</h4>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <RequirementItem
              label={`At least ${policy.minLength} characters`}
              satisfied={password.length >= policy.minLength}
            />
            {policy.requireUppercase && (
              <RequirementItem
                label="Uppercase letter (A-Z)"
                satisfied={/[A-Z]/.test(password)}
              />
            )}
            {policy.requireLowercase && (
              <RequirementItem
                label="Lowercase letter (a-z)"
                satisfied={/[a-z]/.test(password)}
              />
            )}
            {policy.requireNumbers && (
              <RequirementItem
                label="Number (0-9)"
                satisfied={/\d/.test(password)}
              />
            )}
            {policy.requireSpecialChars && (
              <RequirementItem
                label="Special character (!@#$...)"
                satisfied={/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/.test(password)}
              />
            )}
          </div>
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Issues
            </h4>
            <ul className="text-xs text-red-600 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {showSuggestions && validation.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Suggestions
            </h4>
            <ul className="text-xs text-blue-600 space-y-1">
              {validation.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success message */}
        {validation.isValid && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Password meets all requirements</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RequirementItemProps {
  label: string;
  satisfied: boolean;
}

function RequirementItem({ label, satisfied }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2">
      {satisfied ? (
        <CheckCircle className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-red-400" />
      )}
      <span className={satisfied ? 'text-green-600' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
}

/**
 * Simple password strength meter (compact version)
 */
export function PasswordMeter({ 
  password, 
  className 
}: { 
  password: string; 
  className?: string; 
}) {
  const validation = validatePassword(password);
  const strengthInfo = getPasswordStrengthDescription(validation.score);

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <Progress value={validation.score} className="h-1" />
      <div className="flex items-center justify-between text-xs">
        <span className={strengthInfo.color}>{strengthInfo.label}</span>
        <span className="text-muted-foreground">{validation.score}/100</span>
      </div>
    </div>
  );
}