/**
 * Password strength validation and security utilities
 * Implements industry-standard password requirements
 */

import { z } from 'zod';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidPersonalInfo: boolean;
  maxLength?: number;
}

// Default password policy for production
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbidCommonPasswords: true,
  forbidPersonalInfo: true,
  maxLength: 128,
};

// Common passwords to forbid (subset for demo - in production, use a larger list)
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '123456789', 'qwerty',
  'abc123', 'password1', 'admin', 'welcome', 'login',
  'p@ssword', 'password!', '12345678', 'letmein', 'monkey',
  'dragon', 'master', 'hello', 'freedom', 'whatever',
  'qwerty123', 'trustno1', 'superman', 'batman', 'facebook',
  'google', 'microsoft', 'apple', 'amazon', 'twitter',
];

// Special characters for validation
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Validate password strength against policy
 */
export function validatePassword(
  password: string, 
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  personalInfo: string[] = []
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length validation
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  } else {
    score += Math.min(25, (password.length / policy.minLength) * 25);
  }

  if (policy.maxLength && password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  // Character type requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password);

  if (policy.requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add uppercase letters (A-Z)');
  } else if (hasUppercase) {
    score += 15;
  }

  if (policy.requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add lowercase letters (a-z)');
  } else if (hasLowercase) {
    score += 15;
  }

  if (policy.requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add numbers (0-9)');
  } else if (hasNumbers) {
    score += 15;
  }

  if (policy.requireSpecialChars && !hasSpecialChars) {
    errors.push('Password must contain at least one special character');
    suggestions.push(`Add special characters (${SPECIAL_CHARS.slice(0, 10)}...)`);
  } else if (hasSpecialChars) {
    score += 15;
  }

  // Common password check
  if (policy.forbidCommonPasswords && isCommonPassword(password)) {
    errors.push('Password is too common and easily guessable');
    suggestions.push('Use a unique password that\'s not commonly used');
  }

  // Personal information check
  if (policy.forbidPersonalInfo && containsPersonalInfo(password, personalInfo)) {
    errors.push('Password should not contain personal information');
    suggestions.push('Avoid using names, email, or other personal details');
  }

  // Pattern analysis
  const patternScore = analyzePatterns(password);
  score += patternScore;

  // Entropy bonus for longer passwords
  if (password.length >= 16) {
    score += 10;
  }
  if (password.length >= 20) {
    score += 5;
  }

  // Cap score at 100
  score = Math.min(100, score);

  return {
    isValid: errors.length === 0,
    score,
    errors,
    suggestions,
  };
}

/**
 * Check if password is in common passwords list
 */
function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}

/**
 * Check if password contains personal information
 */
function containsPersonalInfo(password: string, personalInfo: string[]): boolean {
  const lowerPassword = password.toLowerCase();
  
  return personalInfo.some(info => {
    if (!info || info.length < 3) return false;
    return lowerPassword.includes(info.toLowerCase());
  });
}

/**
 * Analyze password patterns and award/deduct points
 */
function analyzePatterns(password: string): number {
  let score = 0;

  // Repeated characters penalty
  const repeatedChars = /(.)\1{2,}/.test(password);
  if (repeatedChars) {
    score -= 10;
  }

  // Sequential characters penalty
  const sequential = hasSequentialChars(password);
  if (sequential) {
    score -= 10;
  }

  // Character variety bonus
  const uniqueChars = new Set(password).size;
  const varietyRatio = uniqueChars / password.length;
  if (varietyRatio > 0.7) {
    score += 10;
  }

  return score;
}

/**
 * Check for sequential characters (abc, 123, qwerty, etc.)
 */
function hasSequentialChars(password: string): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiopasdfghjklzxcvbnm',
    '!@#$%^&*()',
  ];

  for (const sequence of sequences) {
    for (let i = 0; i <= sequence.length - 3; i++) {
      const subseq = sequence.slice(i, i + 3);
      if (password.toLowerCase().includes(subseq)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generate password strength description
 */
export function getPasswordStrengthDescription(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: 'Excellent',
      color: 'text-green-600',
      description: 'Very strong password - excellent security',
    };
  } else if (score >= 70) {
    return {
      label: 'Strong',
      color: 'text-green-500',
      description: 'Strong password - good security',
    };
  } else if (score >= 50) {
    return {
      label: 'Moderate',
      color: 'text-yellow-500',
      description: 'Moderate password - could be stronger',
    };
  } else if (score >= 30) {
    return {
      label: 'Weak',
      color: 'text-orange-500',
      description: 'Weak password - needs improvement',
    };
  } else {
    return {
      label: 'Very Weak',
      color: 'text-red-500',
      description: 'Very weak password - please choose a stronger one',
    };
  }
}

/**
 * Zod schema for password validation
 */
export function createPasswordSchema(
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  personalInfo: string[] = []
) {
  return z.string().refine(
    (password) => {
      const result = validatePassword(password, policy, personalInfo);
      return result.isValid;
    },
    (password) => {
      const result = validatePassword(password, policy, personalInfo);
      return {
        message: result.errors.join('; '),
      };
    }
  );
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = SPECIAL_CHARS;
  
  // Ensure at least one character from each required type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill remaining length with random characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has been compromised (placeholder for HIBP API)
 */
export async function isPasswordCompromised(password: string): Promise<boolean> {
  // In a real implementation, you would hash the password and check against
  // Have I Been Pwned API or similar service
  // For now, just return false as this would require external API calls
  return Promise.resolve(false);
}