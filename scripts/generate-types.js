#!/usr/bin/env node

/**
 * TypeScript Type Generation Script
 * Generates TypeScript types from Supabase database schema
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function extractProjectId(url) {
  if (!url) return null;
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function installSupabaseCLI() {
  console.log('📦 Installing Supabase CLI...');
  try {
    execSync('npm install -g supabase', { stdio: 'inherit' });
    console.log('✅ Supabase CLI installed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to install Supabase CLI:', error.message);
    return false;
  }
}

function generateTypesWithAPI(projectId) {
  console.log('🔄 Generating types using API method...');
  
  const typesDir = path.join(process.cwd(), 'src', 'lib', 'types');
  ensureDirectoryExists(typesDir);
  
  const outputFile = path.join(typesDir, 'database.types.ts');
  
  try {
    const command = `npx supabase gen types typescript --project-id ${projectId} --schema public`;
    const types = execSync(command, { encoding: 'utf8' });
    
    fs.writeFileSync(outputFile, types);
    console.log(`✅ Types generated successfully: ${outputFile}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to generate types with API:', error.message);
    return false;
  }
}

function generateTypesWithCLI() {
  console.log('🔄 Attempting to generate types using Supabase CLI...');
  
  const typesDir = path.join(process.cwd(), 'src', 'lib', 'types');
  ensureDirectoryExists(typesDir);
  
  const outputFile = path.join(typesDir, 'database.types.ts');
  
  try {
    // Check if project is already linked
    const command = `supabase gen types typescript --linked`;
    const types = execSync(command, { encoding: 'utf8' });
    
    fs.writeFileSync(outputFile, types);
    console.log(`✅ Types generated successfully: ${outputFile}`);
    return true;
  } catch (error) {
    console.log('⚠️  Project not linked or CLI method failed');
    return false;
  }
}

function createFallbackTypes() {
  console.log('📝 Creating fallback type definitions...');
  
  const typesDir = path.join(process.cwd(), 'src', 'lib', 'types');
  ensureDirectoryExists(typesDir);
  
  const outputFile = path.join(typesDir, 'database.types.ts');
  
  const fallbackTypes = `// Generated fallback types - please regenerate with Supabase CLI when possible
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          full_name: string
          avatar_url: string | null
          role: 'admin' | 'manager' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          first_name?: string
          last_name?: string
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          company_name: string
          contact_name: string
          email: string | null
          phone: string | null
          status: 'active' | 'prospect' | 'inactive' | 'churned'
          industry: string | null
          website: string | null
          address: string | null
          notes: string | null
          last_contact_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          contact_name: string
          email?: string | null
          phone?: string | null
          status?: 'active' | 'prospect' | 'inactive' | 'churned'
          industry?: string | null
          website?: string | null
          address?: string | null
          notes?: string | null
          last_contact_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          contact_name?: string
          email?: string | null
          phone?: string | null
          status?: 'active' | 'prospect' | 'inactive' | 'churned'
          industry?: string | null
          website?: string | null
          address?: string | null
          notes?: string | null
          last_contact_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
`;

  fs.writeFileSync(outputFile, fallbackTypes);
  console.log(`✅ Fallback types created: ${outputFile}`);
  console.log('⚠️  Please regenerate with proper Supabase CLI when possible');
  
  return true;
}

async function main() {
  console.log('🚀 SalesFlow TypeScript Type Generator\n');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }
  
  const projectId = extractProjectId(supabaseUrl);
  if (!projectId) {
    console.error('❌ Could not extract project ID from Supabase URL');
    process.exit(1);
  }
  
  console.log(`Database URL: ${supabaseUrl}`);
  console.log(`Project ID: ${projectId}\n`);
  
  // Method 1: Try Supabase CLI (linked project)
  if (checkSupabaseCLI()) {
    console.log('✅ Supabase CLI found');
    if (generateTypesWithCLI()) {
      console.log('\n🎉 Type generation completed successfully!');
      return;
    }
  } else {
    console.log('⚠️  Supabase CLI not found');
  }
  
  // Method 2: Try API method with project ID
  if (generateTypesWithAPI(projectId)) {
    console.log('\n🎉 Type generation completed successfully!');
    return;
  }
  
  // Method 3: Create fallback types
  console.log('\n⚠️  All automatic methods failed, creating fallback types...');
  createFallbackTypes();
  
  console.log('\n📋 Manual Steps to Generate Proper Types:');
  console.log('1. Install Supabase CLI: npm install -g supabase');
  console.log('2. Login: supabase login');
  console.log(`3. Link project: supabase link --project-ref ${projectId}`);
  console.log('4. Generate types: supabase gen types typescript --linked > src/lib/types/database.types.ts');
  
  console.log('\n✅ Fallback types are ready for development');
}

if (require.main === module) {
  main().catch(console.error);
}