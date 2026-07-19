import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ManageRequest = {
  action?: 'resend' | 'revoke';
  invitationId?: string;
  organizationId?: string;
  redirectTo?: string;
};

type InvitationRow = {
  id: string;
  organization_id: string;
  email: string;
  display_name: string | null;
  role: string;
  status: string;
  expires_at: string;
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

function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Metoden støttes ikke.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('INVITATION_FROM_EMAIL');

    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Supabase-miljøvariabler mangler.' }, 500);

    const authorization = request.headers.get('Authorization');
    if (!authorization) return json({ error: 'Du må være innlogget.' }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const accessToken = authorization.replace(/^Bearer\s+/i, '');
    const { data: userData, error: userError } = await adminClient.auth.getUser(accessToken);
    if (userError || !userData.user) return json({ error: 'Ugyldig innlogging.' }, 401);

    const payload = (await request.json()) as ManageRequest;
    const action = payload.action;
    const invitationId = payload.invitationId?.trim();
    const organizationId = payload.organizationId?.trim();

    if (!action || !invitationId || !organizationId) {
      return json({ error: 'Handling, invitasjon og organisasjon er påkrevd.' }, 400);
    }

    const { data, error: invitationError } = await adminClient
      .from('organization_invitations')
      .select('id,organization_id,email,display_name,role,status,expires_at')
      .eq('id', invitationId)
      .eq('organization_id', organizationId)
      .single();

    if (invitationError || !data) return json({ error: 'Invitasjonen ble ikke funnet.' }, 404);
    const invitation = data as InvitationRow;

    if (action === 'revoke') {
      if (!['pending', 'sent'].includes(invitation.status)) {
        return json({ error: 'Bare aktive invitasjoner kan tilbakekalles.' }, 409);
      }

      const now = new Date().toISOString();
      const { error } = await adminClient
        .from('organization_invitations')
        .update({ status: 'revoked', revoked_at: now, error_message: null })
        .eq('id', invitation.id)
        .in('status', ['pending', 'sent']);

      if (error) return json({ error: 'Kunne ikke tilbakekalle invitasjonen.' }, 500);

      await adminClient
        .from('organization_admins')
        .update({ invitation_status: 'revoked', updated_at: now })
        .eq('organization_id', organizationId)
        .eq('email', invitation.email);

      return json({ invitationId: invitation.id, status: 'revoked' });
    }

    if (!['pending', 'sent', 'expired', 'failed'].includes(invitation.status)) {
      return json({ error: 'Denne invitasjonen kan ikke sendes på nytt.' }, 409);
    }
    if (!resendApiKey || !fromEmail) return json({ error: 'Resend er ikke konfigurert.' }, 500);

    const redirectTo = payload.redirectTo?.trim();
    if (!redirectTo) return json({ error: 'Invitasjonslenke mangler.' }, 400);

    const { data: organization } = await adminClient
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();
    const organizationName = organization?.name || 'organisasjonen';

    const token = createToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { error: closeError } = await adminClient
      .from('organization_invitations')
      .update({ status: 'revoked', revoked_at: now })
      .eq('id', invitation.id);
    if (closeError) return json({ error: 'Kunne ikke deaktivere den gamle invitasjonen.' }, 500);

    const { data: replacement, error: insertError } = await adminClient
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email: invitation.email,
        display_name: invitation.display_name,
        role: invitation.role,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: expiresAt,
        invited_by: userData.user.id,
      })
      .select('id')
      .single();

    if (insertError || !replacement) return json({ error: 'Kunne ikke opprette en ny invitasjon.' }, 500);

    const invitationUrl = new URL(redirectTo);
    invitationUrl.searchParams.set('token', token);
    invitationUrl.searchParams.set('organization', organizationId);
    const greeting = invitation.display_name ? `Hei ${invitation.display_name},` : 'Hei,';

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: [invitation.email],
        subject: `Ny invitasjon til ${organizationName}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:auto">
            <h1 style="font-size:24px">Ny invitasjonslenke</h1>
            <p>${greeting}</p>
            <p>Du har fått en ny invitasjonslenke som administrator for <strong>${organizationName}</strong> i Yasaflow.</p>
            <p><a href="${invitationUrl.toString()}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none">Godta invitasjonen</a></p>
            <p style="font-size:13px;color:#6b7280">Den gamle lenken er deaktivert. Denne lenken utløper om 72 timer.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      await adminClient
        .from('organization_invitations')
        .update({ status: 'failed', error_message: emailError })
        .eq('id', replacement.id);
      return json({ error: 'Den nye invitasjonen ble opprettet, men e-posten kunne ikke sendes.' }, 502);
    }

    await adminClient
      .from('organization_invitations')
      .update({ status: 'sent', sent_at: now })
      .eq('id', replacement.id);

    await adminClient
      .from('organization_admins')
      .upsert({
        organization_id: organizationId,
        display_name: invitation.display_name || invitation.email,
        email: invitation.email,
        role: invitation.role,
        invitation_status: 'invited',
        updated_at: now,
      }, { onConflict: 'organization_id,email' });

    return json({
      invitationId: replacement.id,
      replacedInvitationId: invitation.id,
      email: invitation.email,
      expiresAt,
      status: 'sent',
    });
  } catch (error) {
    console.error('Manage invitation error', error);
    return json({ error: 'En uventet feil oppstod.' }, 500);
  }
});
