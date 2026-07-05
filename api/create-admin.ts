import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requestedRole(role: unknown) {
  return role === 'super_admin' || role === 'superadmin' ? 'superadmin' : 'admin';
}

async function findAuthUserByEmail(serviceClient: any, email: string) {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) return null;

    const users = data?.users || [];
    const found = users.find((user: any) => String(user.email || '').toLowerCase() === email);

    if (found) return found;
    if (users.length < 100) return null;

    page += 1;
  }

  return null;
}

async function upsertAdminProfile(serviceClient: any, params: {
  authUserId: string;
  email: string;
  displayName: string;
  role: string;
}) {
  const existing = await serviceClient
    .from('admins')
    .select('id, username, display_name, role, auth_user_id')
    .eq('auth_user_id', params.authUserId)
    .maybeSingle();

  if (existing.data) {
    const updated = await serviceClient
      .from('admins')
      .update({
        username: params.email,
        display_name: params.displayName,
        role: params.role,
        auth_user_id: params.authUserId,
      })
      .eq('id', existing.data.id)
      .select('id, username, display_name, role, auth_user_id')
      .single();

    if (updated.data && !updated.error) return { adminRow: updated.data, insertError: null };
  }

  const adminId = existing.data?.id || `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const roleVariants = params.role === 'superadmin' ? ['superadmin', 'super_admin'] : ['admin'];
  let adminRow: any = null;
  let insertError: any = null;

  for (const roleValue of roleVariants) {
    const baseAdminPayload = {
      id: adminId,
      username: params.email,
      display_name: params.displayName,
      role: roleValue,
      auth_user_id: params.authUserId,
    };

    const firstTry = await serviceClient
      .from('admins')
      .insert(baseAdminPayload)
      .select('id, username, display_name, role, auth_user_id')
      .single();

    adminRow = firstTry.data;
    insertError = firstTry.error;

    if (adminRow && !insertError) break;

    const legacyPayload = {
      ...baseAdminPayload,
      password: '__managed_by_supabase_auth__',
      security_question: null,
      security_answer: null,
    };

    const legacyTry = await serviceClient
      .from('admins')
      .insert(legacyPayload)
      .select('id, username, display_name, role, auth_user_id')
      .single();

    adminRow = legacyTry.data;
    insertError = legacyTry.error;

    if (adminRow && !insertError) break;
  }

  return { adminRow, insertError };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return res.status(500).json({ error: 'Missing Supabase environment variables' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const { data: currentAdmin, error: adminLookupError } = await serviceClient
    .from('admins')
    .select('id, role')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();

  if (adminLookupError || !currentAdmin) {
    return res.status(403).json({ error: 'Admin profile not found' });
  }

  if (currentAdmin.role !== 'super_admin' && currentAdmin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only super admins can create admins' });
  }

  const { email, password, displayName, role } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanDisplayName = String(displayName || '').trim();
  const cleanPassword = String(password || '');
  const cleanRole = requestedRole(role);

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!cleanDisplayName) {
    return res.status(400).json({ error: 'Display name is required' });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  let authUserId = '';
  let createdNewAuthUser = false;

  const temporaryMetadata = {
    display_name: cleanDisplayName,
    role: cleanRole,
    must_change_password: true,
  };

  const { data: authUser, error: createUserError } = await serviceClient.auth.admin.createUser({
    email: cleanEmail,
    password: cleanPassword,
    email_confirm: true,
    user_metadata: temporaryMetadata,
  });

  if (authUser?.user && !createUserError) {
    authUserId = authUser.user.id;
    createdNewAuthUser = true;
  } else {
    const existingAuthUser = await findAuthUserByEmail(serviceClient, cleanEmail);

    if (!existingAuthUser) {
      return res.status(400).json({ error: createUserError?.message || 'Could not create or find auth user' });
    }

    authUserId = existingAuthUser.id;

    await serviceClient.auth.admin.updateUserById(authUserId, {
      password: cleanPassword,
      user_metadata: temporaryMetadata,
    });
  }

  const { adminRow, insertError } = await upsertAdminProfile(serviceClient, {
    authUserId,
    email: cleanEmail,
    displayName: cleanDisplayName,
    role: cleanRole,
  });

  if (insertError || !adminRow) {
    if (createdNewAuthUser) {
      await serviceClient.auth.admin.deleteUser(authUserId);
    }

    return res.status(500).json({ error: insertError?.message || 'Could not create admin profile' });
  }

  return res.status(200).json({ ok: true, admin: adminRow });
}
