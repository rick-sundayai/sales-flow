#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates required environment variables for SalesFlow CRM
 * Run with: npm run validate-env
 */

const requiredVariables = {
  development: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL'
  ],
  production: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
};

const optionalVariables = [
  'NEXT_PUBLIC_GOOGLE_AI_API_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SENDGRID_API_KEY'
];

const urlVariables = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SENTRY_DSN'
];

function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredVariables[env] || requiredVariables.development;
  
  console.log(`🔍 Validating environment variables for: ${env.toUpperCase()}`);
  console.log('='.repeat(50));
  
  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  console.log('\n✅ REQUIRED VARIABLES:');
  for (const variable of required) {
    const value = process.env[variable];
    if (!value) {
      console.log(`❌ ${variable}: MISSING`);
      hasErrors = true;
    } else if (value.includes('your-') || value.includes('replace-')) {
      console.log(`⚠️  ${variable}: DEFAULT VALUE (please update)`);
      hasWarnings = true;
    } else {
      // Validate URL format for URL variables
      if (urlVariables.includes(variable)) {
        try {
          new URL(value);
          console.log(`✅ ${variable}: Valid URL`);
        } catch (error) {
          console.log(`❌ ${variable}: INVALID URL format`);
          hasErrors = true;
        }
      } else {
        console.log(`✅ ${variable}: Set`);
      }
    }
  }

  // Check optional variables
  console.log('\n🔧 OPTIONAL VARIABLES:');
  for (const variable of optionalVariables) {
    const value = process.env[variable];
    if (!value) {
      console.log(`⚪ ${variable}: Not set`);
    } else if (value.includes('your-') || value.includes('replace-')) {
      console.log(`⚠️  ${variable}: Default value (feature disabled)`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${variable}: Set`);
    }
  }

  // Security checks
  console.log('\n🔒 SECURITY CHECKS:');
  
  // Check for development URLs in production
  if (env === 'production') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && (appUrl.includes('localhost') || appUrl.includes('127.0.0.1'))) {
      console.log('❌ NEXT_PUBLIC_APP_URL: Using localhost in production');
      hasErrors = true;
    } else {
      console.log('✅ App URL: Production-ready');
    }
  }

  // Check for exposed secrets
  const exposedSecrets = Object.keys(process.env).filter(key => {
    return key.startsWith('NEXT_PUBLIC_') && 
           (key.includes('SECRET') || key.includes('PRIVATE_KEY') || key.includes('PASSWORD'));
  });

  if (exposedSecrets.length > 0) {
    console.log(`❌ EXPOSED SECRETS: ${exposedSecrets.join(', ')}`);
    console.log('   Secret keys should NOT start with NEXT_PUBLIC_');
    hasErrors = true;
  } else {
    console.log('✅ No exposed secrets detected');
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ VALIDATION FAILED');
    console.log('\nPlease fix the errors above before proceeding.');
    console.log('Refer to .env.example for the correct variable names and formats.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  VALIDATION PASSED WITH WARNINGS');
    console.log('\nSome optional features may not work properly.');
    console.log('Consider updating the warning variables for full functionality.');
    process.exit(0);
  } else {
    console.log('✅ VALIDATION PASSED');
    console.log('\nAll required environment variables are properly configured.');
    process.exit(0);
  }
}

// Auto-detect environment file
const fs = require('fs');
const path = require('path');

const envFiles = ['.env.local', '.env.production', '.env.development', '.env'];
let envFileFound = false;

for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    console.log(`📄 Loading environment from: ${envFile}`);
    require('dotenv').config({ path: envPath });
    envFileFound = true;
    break;
  }
}

if (!envFileFound) {
  console.log('⚠️  No environment file found. Using system environment variables only.');
}

// Run validation
validateEnvironment();