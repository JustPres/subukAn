# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: poster-flow.spec.ts >> Poster Flow E2E >> should create a listing and show the mock payment link
- Location: tests\e2e\poster-flow.spec.ts:13:7

# Error details

```
Error: Failed to list users: {}
```

# Test source

```ts
  1   | import { createClient, User, Session } from '@supabase/supabase-js';
  2   | import { BrowserContext } from '@playwright/test';
  3   | 
  4   | const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  5   | const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  6   | const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  7   | 
  8   | if (!supabaseUrl || !supabaseServiceKey) {
  9   |   throw new Error('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are required.');
  10  | }
  11  | 
  12  | const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  13  |   auth: {
  14  |     persistSession: false,
  15  |     autoRefreshToken: false,
  16  |   },
  17  | });
  18  | 
  19  | const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  20  |   auth: {
  21  |     persistSession: false,
  22  |     autoRefreshToken: false,
  23  |   },
  24  | });
  25  | 
  26  | /**
  27  |  * Ensures a test user exists in Supabase Auth and has the correct profile role.
  28  |  */
  29  | export async function getOrCreateUser(email: string, password: string, role: 'poster' | 'tester'): Promise<User> {
  30  |   const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  31  |   if (listError) {
> 32  |     throw new Error(`Failed to list users: ${listError.message}`);
      |           ^ Error: Failed to list users: {}
  33  |   }
  34  | 
  35  |   let user = users.find((u) => u.email === email);
  36  | 
  37  |   if (!user) {
  38  |     const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
  39  |       email,
  40  |       password,
  41  |       email_confirm: true,
  42  |       user_metadata: {
  43  |         role,
  44  |         full_name: role === 'poster' ? 'Test Poster' : 'Test Tester',
  45  |         device_type: 'desktop',
  46  |         tech_comfort_level: role === 'poster' ? 'casual_user' : 'non_technical',
  47  |         phone_verified: true,
  48  |       },
  49  |     });
  50  | 
  51  |     if (createError || !createData.user) {
  52  |       throw new Error(`Failed to create user ${email}: ${createError?.message}`);
  53  |     }
  54  |     user = createData.user;
  55  |   } else {
  56  |     // If the user already exists, ensure their profile role is synchronized
  57  |     const { error: profileError } = await supabaseAdmin
  58  |       .from('profiles')
  59  |       .upsert({
  60  |         id: user.id,
  61  |         role,
  62  |         full_name: role === 'poster' ? 'Test Poster' : 'Test Tester',
  63  |         device_type: 'desktop',
  64  |         tech_comfort_level: role === 'poster' ? 'casual_user' : 'non_technical',
  65  |         phone_verified: true,
  66  |         age_group: role === 'tester' ? '25-34' : null,
  67  |       });
  68  | 
  69  |     if (profileError) {
  70  |       console.warn(`Warning: failed to sync profile for existing user: ${profileError.message}`);
  71  |     }
  72  |   }
  73  | 
  74  |   return user;
  75  | }
  76  | 
  77  | /**
  78  |  * Log in with email and password and return the session details.
  79  |  */
  80  | export async function loginAndGetSession(email: string, password: string): Promise<Session> {
  81  |   const { data, error } = await supabaseClient.auth.signInWithPassword({
  82  |     email,
  83  |     password,
  84  |   });
  85  | 
  86  |   if (error || !data.session) {
  87  |     throw new Error(`Failed to sign in with password for ${email}: ${error?.message}`);
  88  |   }
  89  | 
  90  |   return data.session;
  91  | }
  92  | 
  93  | /**
  94  |  * Sets the Supabase session cookie on the browser context to bypass UI login.
  95  |  */
  96  | export async function bypassAuth(context: BrowserContext, email: string, password: string, role: 'poster' | 'tester'): Promise<void> {
  97  |   await getOrCreateUser(email, password, role);
  98  |   const session = await loginAndGetSession(email, password);
  99  | 
  100 |   // Set multiple potential storage keys to cover various Supabase config ref parsing styles
  101 |   const cookieNames = [
  102 |     'sb-laecyjtfezewxavfzulj-auth-token', // Custom / standard ref
  103 |     'sb-localhost-auth-token',           // Localhost hostname fallback
  104 |     'sb-localhost-3000-auth-token',      // Localhost with port fallback
  105 |     'sb-auth-token',                     // Default generic fallback
  106 |   ];
  107 | 
  108 |   const cookieValue = encodeURIComponent(JSON.stringify(session));
  109 | 
  110 |   await context.addCookies(
  111 |     cookieNames.map((name) => ({
  112 |       name,
  113 |       value: cookieValue,
  114 |       domain: 'localhost',
  115 |       path: '/',
  116 |       expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
  117 |       secure: false, // Local HTTP development setup
  118 |       sameSite: 'Lax',
  119 |     }))
  120 |   );
  121 | }
  122 | 
  123 | /**
  124 |  * Creates a mock listing for testing.
  125 |  */
  126 | export async function createMockListing(title: string, isQuickImpression: boolean) {
  127 |   const poster = await getOrCreateUser('test-poster@example.com', 'password123', 'poster');
  128 | 
  129 |   // Delete existing listing with the same title to avoid duplicate/leftover records
  130 |   await supabaseAdmin
  131 |     .from('listings')
  132 |     .delete()
```