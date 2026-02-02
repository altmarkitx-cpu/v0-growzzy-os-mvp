import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase clients to handle missing env vars
let supabaseAdmin: any = null;
let supabase: any = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    }
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseAdmin;
}

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required');
    }
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

export async function registerUser(email: string, password: string, fullName: string) {
  // Create user in Supabase Auth
  const admin = getSupabaseAdmin();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for demo
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Failed to create user');
  }

  console.log("[v0] User registered:", authData.user.id);

  // Note: User profile in 'users' table will be created on first dashboard visit
  // This avoids RLS INSERT policy issues

  return {
    id: authData.user.id,
    email,
    full_name: fullName,
    message: 'Account created successfully! You can now log in.',
  };
}

export async function loginUser(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log("[v0] Auth error:", error.message);
    return null;
  }

  if (!data.user) {
    console.log("[v0] No user data returned from auth");
    return null;
  }

  console.log("[v0] User authenticated:", data.user.id);

  // Return auth user directly without trying to fetch/create profile
  // Profile creation happens on first dashboard visit if needed
  return {
    id: data.user.id,
    email: data.user.email,
    full_name: data.user.user_metadata?.full_name || 'User',
    session: data.session,
  };
}

export async function resetPasswordEmail(email: string) {
  const client = getSupabaseClient();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { message: 'Password reset email sent' };
}
