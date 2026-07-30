import { createClient, User, Session } from '@supabase/supabase-js';
import { BrowserContext } from '@playwright/test';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are required.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Ensures a test user exists in Supabase Auth and has the correct profile role.
 */
export async function getOrCreateUser(email: string, password: string, role: 'poster' | 'tester'): Promise<User> {
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  let user = users.find((u) => u.email === email);

  if (!user) {
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: role === 'poster' ? 'Test Poster' : 'Test Tester',
        device_type: 'desktop',
        tech_comfort_level: role === 'poster' ? 'casual_user' : 'non_technical',
        phone_verified: true,
      },
    });

    if (createError || !createData.user) {
      throw new Error(`Failed to create user ${email}: ${createError?.message}`);
    }
    user = createData.user;
  } else {
    // If the user already exists, ensure their profile role is synchronized
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        role,
        full_name: role === 'poster' ? 'Test Poster' : 'Test Tester',
        device_type: 'desktop',
        tech_comfort_level: role === 'poster' ? 'casual_user' : 'non_technical',
        phone_verified: true,
        age_group: role === 'tester' ? '25-34' : null,
      });

    if (profileError) {
      console.warn(`Warning: failed to sync profile for existing user: ${profileError.message}`);
    }
  }

  return user;
}

/**
 * Log in with email and password and return the session details.
 */
export async function loginAndGetSession(email: string, password: string): Promise<Session> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(`Failed to sign in with password for ${email}: ${error?.message}`);
  }

  return data.session;
}

/**
 * Sets the Supabase session cookie on the browser context to bypass UI login.
 */
export async function bypassAuth(context: BrowserContext, email: string, password: string, role: 'poster' | 'tester'): Promise<void> {
  await getOrCreateUser(email, password, role);
  const session = await loginAndGetSession(email, password);

  // Set multiple potential storage keys to cover various Supabase config ref parsing styles
  const cookieNames = [
    'sb-laecyjtfezewxavfzulj-auth-token', // Custom / standard ref
    'sb-localhost-auth-token',           // Localhost hostname fallback
    'sb-localhost-3000-auth-token',      // Localhost with port fallback
    'sb-auth-token',                     // Default generic fallback
  ];

  const cookieValue = encodeURIComponent(JSON.stringify(session));

  await context.addCookies(
    cookieNames.map((name) => ({
      name,
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
      secure: false, // Local HTTP development setup
      sameSite: 'Lax',
    }))
  );
}

/**
 * Creates a mock listing for testing.
 */
export async function createMockListing(title: string, isQuickImpression: boolean) {
  const poster = await getOrCreateUser('test-poster@example.com', 'password123', 'poster');

  // Delete existing listing with the same title to avoid duplicate/leftover records
  await supabaseAdmin
    .from('listings')
    .delete()
    .eq('title', title);

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('listings')
    .insert({
      poster_id: poster.id,
      title,
      description: 'This is a mock description for testing purposes. It has more than twenty characters.',
      rate_per_tester: 200,
      slots_count: 5,
      total_budget: 1000,
      review_window_minutes: 30,
      status: 'open',
      is_quick_impression: isQuickImpression,
      impression_duration_seconds: 5,
    })
    .select()
    .single();

  if (listingError || !listing) {
    throw new Error(`Failed to create mock listing: ${listingError?.message}`);
  }

  // Insert a task for the listing
  const { error: taskError } = await supabaseAdmin
    .from('tasks')
    .insert({
      listing_id: listing.id,
      order_index: 0,
      question_text: 'What did you see on the screen? (Mock Question)',
      requires_recording: false,
      requires_image: false,
    });

  if (taskError) {
    throw new Error(`Failed to create mock task: ${taskError.message}`);
  }

  return listing;
}
