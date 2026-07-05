import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizeRole(role: unknown) {
  return role === 'super_admin' || role === 'superadmin' ? 'superadmin' : 'admin';
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
  const cleanRole = normalizeRole(role);

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!cleanDisplayName) {
    return res.status(400).json({ error: 'Display name is required' });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const { data: authUser, error: createUserError } = await serviceClient.auth.admin.createUser({
    email: cleanEmail,
    password: cleanPassword,
    email_confirm: true,
    user_metadata: {
      display_name: cleanDisplayName,
      role: cleanRole,
    },
  });

  if (createUserError || !authUser.user) {
    return res.status(400).json({ error: createUserError?.message || 'Could not create auth user' });
  }

  const adminId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const baseAdminPayload = {
    id: adminId,
    username: cleanEmail,
    display_name: cleanDisplayName,
    role: cleanRole,
    auth_user_id: authUser.user.id,
  };

  let { data: adminRow, error: insertError } = await serviceClient
    .from('admins')
    .insert(baseAdminPayload)
    .select('id, username, display_name, role, auth_user_id')
    .single();

  if (insertError) {
    const legacyPayload = {
      ...baseAdminPayload,
      password: '__managed_by_supabase_auth__',
      security_question: null,
      security_answer: null,
    };

    const retry = await serviceClient
      .from('admins')
      .insert(legacyPayload)
      .select('id, username, display_name, role, auth_user_id')
      .single();

    adminRow = retry.data;
    insertError = retry.error;
  }

  if (insertError || !adminRow) {
    await serviceClient.auth.admin.deleteUser(authUser.user.id);
    return res.status(500).json({ error: insertError?.message || 'Could not create admin profile' });
  }

  return res.status(200).json({ ok: true, admin: adminRow });
}
