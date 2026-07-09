import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InvitePayload = {
  organizationId?: string;
  email?: string;
  displayName?: string;
  redirectTo?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase server configuration' }, 500);
  }

  let payload: InvitePayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const organizationId = String(payload.organizationId || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const displayName = String(payload.displayName || '').trim();
  const redirectTo = String(payload.redirectTo || '').trim() || undefined;

  if (!organizationId) {
    return jsonResponse({ error: 'organizationId is required' }, 400);
  }

  if (!email || !email.includes('@')) {
    return jsonResponse({ error: 'Valid email is required' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: organization, error: organizationError } = await adminClient
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single();

  if (organizationError || !organization) {
    return jsonResponse({ error: 'Organization not found' }, 404);
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      organization_id: organizationId,
      organization_name: organization.name,
      display_name: displayName || email,
      role: 'admin',
    },
  });

  if (inviteError) {
    return jsonResponse({ error: inviteError.message }, 400);
  }

  const userId = inviteData.user?.id ?? null;

  const { error: adminError } = await adminClient
    .from('organization_admins')
    .upsert({
      organization_id: organizationId,
      user_id: userId,
      display_name: displayName || email,
      email,
      role: 'admin',
      invitation_status: 'invited',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,email' });

  if (adminError) {
    return jsonResponse({ error: adminError.message }, 400);
  }

  await adminClient
    .from('organization_provisioning_steps')
    .upsert({
      organization_id: organizationId,
      step_key: 'admin_ready',
      label: 'Admin klar',
      status: 'invited',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,step_key' });

  return jsonResponse({
    ok: true,
    organizationId,
    email,
    userId,
  });
});
