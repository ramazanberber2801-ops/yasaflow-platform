import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PASSWORD_REQUIREMENT_MESSAGE = 'Passordet må ha minst 6 tegn og inneholde stor bokstav, liten bokstav, tall og spesialtegn.';
const isValidPassword = (password: string) => password.length >= 6
  && /[A-Z]/.test(password)
  && /[a-z]/.test(password)
  && /[0-9]/.test(password)
  && /[^A-Za-z0-9]/.test(password);

type InvitationPayload = {
  action?: 'inspect' | 'accept';
  token?: string;
  organizationId?: string;
  password?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Metoden støttes ikke.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Supabase-miljøvariabler mangler.' }, 500);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const payload = (await request.json()) as InvitationPayload;
    const action = payload.action || 'inspect';
    const token = payload.token?.trim();
    const organizationId = payload.organizationId?.trim();
    if (!token || !organizationId) return json({ error: 'Invitasjonslenken er ufullstendig.' }, 400);

    const tokenHash = await sha256(token);
    const { data: invitation, error: invitationError } = await adminClient
      .from('organization_invitations')
      .select('id, organization_id, email, display_name, role, status, expires_at')
      .eq('organization_id', organizationId)
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (invitationError) {
      console.error('Invitation lookup failed', invitationError);
      return json({ error: 'Kunne ikke kontrollere invitasjonen.' }, 500);
    }
    if (!invitation) return json({ error: 'Invitasjonslenken er ugyldig.' }, 404);

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      if (invitation.status === 'pending' || invitation.status === 'sent') {
        await adminClient.from('organization_invitations').update({ status: 'expired' }).eq('id', invitation.id);
      }
      return json({ error: 'Invitasjonen har utløpt.', status: 'expired' }, 410);
    }
    if (invitation.status === 'accepted') return json({ error: 'Invitasjonen er allerede brukt.', status: 'accepted' }, 409);
    if (invitation.status === 'revoked') return json({ error: 'Invitasjonen er trukket tilbake.', status: 'revoked' }, 410);
    if (!['pending', 'sent'].includes(invitation.status)) return json({ error: 'Invitasjonen kan ikke brukes.', status: invitation.status }, 409);

    const { data: organization } = await adminClient
      .from('organizations')
      .select('id, name, live_url')
      .eq('id', organizationId)
      .maybeSingle();

    if (action === 'inspect') {
      return json({
        valid: true,
        email: invitation.email,
        displayName: invitation.display_name,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        organization: organization || { id: organizationId, name: 'organisasjonen', live_url: '/' },
      });
    }

    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const accessToken = authHeader.replace(/^Bearer\s+/i, '');
      const { data: userData } = await adminClient.auth.getUser(accessToken);
      if (userData.user) {
        if ((userData.user.email || '').toLowerCase() !== invitation.email.toLowerCase()) {
          return json({ error: 'Du er logget inn med en annen e-postadresse enn invitasjonen.' }, 403);
        }
        userId = userData.user.id;
      }
    }

    if (!userId) {
      const password = payload.password || '';
      if (!isValidPassword(password)) return json({ error: PASSWORD_REQUIREMENT_MESSAGE }, 400);

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: invitation.display_name,
          organization_id: invitation.organization_id,
          organization_role: invitation.role,
        },
        app_metadata: {
          organization_id: invitation.organization_id,
          organization_role: invitation.role,
        },
      });

      if (createError || !created.user) {
        const message = createError?.message || '';
        if (/already|registered|exists/i.test(message)) {
          return json({ error: 'Det finnes allerede en konto med denne e-posten. Velg «Jeg har allerede konto» og logg inn.' }, 409);
        }
        console.error('Create invited user failed', createError);
        return json({ error: 'Kunne ikke opprette kontoen.' }, 500);
      }
      userId = created.user.id;
    }

    const now = new Date().toISOString();
    const { error: adminError } = await adminClient
      .from('organization_admins')
      .upsert({
        organization_id: invitation.organization_id,
        display_name: invitation.display_name || invitation.email,
        email: invitation.email,
        role: invitation.role,
        invitation_status: 'active',
        updated_at: now,
      }, { onConflict: 'organization_id,email' });
    if (adminError) {
      console.error('Organization admin activation failed', adminError);
      return json({ error: 'Kontoen ble opprettet, men administratortilgangen kunne ikke aktiveres.' }, 500);
    }

    const { error: acceptError } = await adminClient
      .from('organization_invitations')
      .update({ status: 'accepted', accepted_at: now, accepted_by: userId, error_message: null })
      .eq('id', invitation.id)
      .in('status', ['pending', 'sent']);
    if (acceptError) {
      console.error('Invitation acceptance update failed', acceptError);
      return json({ error: 'Kunne ikke fullføre invitasjonen.' }, 500);
    }

    return json({
      accepted: true,
      email: invitation.email,
      organizationId: invitation.organization_id,
      redirectTo: organization?.live_url || '/admin',
    });
  } catch (error) {
    console.error('Unhandled acceptance error', error);
    return json({ error: 'En uventet feil oppstod.' }, 500);
  }
});
