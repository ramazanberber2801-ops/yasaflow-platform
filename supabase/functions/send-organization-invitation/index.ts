import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type InvitationRequest = {
  organizationId?: string;
  organizationName?: string;
  adminName?: string | null;
  adminEmail?: string;
  redirectTo?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Metoden støttes ikke.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('INVITATION_FROM_EMAIL');

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Supabase-miljøvariabler mangler.' }, 500);
    }

    if (!resendApiKey || !fromEmail) {
      return json({ error: 'Resend er ikke konfigurert.' }, 500);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Du må være innlogget.' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const accessToken = authHeader.replace(/^Bearer\s+/i, '');
    const { data: userData, error: userError } = await adminClient.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return json({ error: 'Ugyldig innlogging.' }, 401);
    }

    const payload = (await request.json()) as InvitationRequest;
    const organizationId = payload.organizationId?.trim();
    const organizationName = payload.organizationName?.trim();
    const adminEmail = payload.adminEmail?.trim().toLowerCase();
    const adminName = payload.adminName?.trim() || null;
    const redirectTo = payload.redirectTo?.trim();

    if (!organizationId || !organizationName || !adminEmail || !redirectTo) {
      return json({ error: 'Organisasjon, e-post og invitasjonslenke er påkrevd.' }, 400);
    }

    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const tokenHashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(token),
    );
    const tokenHash = Array.from(new Uint8Array(tokenHashBuffer), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const { data: invitation, error: invitationError } = await adminClient
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email: adminEmail,
        display_name: adminName,
        role: 'admin',
        token_hash: tokenHash,
        status: 'pending',
        expires_at: expiresAt,
        invited_by: userData.user.id,
      })
      .select('id')
      .single();

    if (invitationError || !invitation) {
      console.error('Invitation insert failed', invitationError);
      return json({ error: 'Kunne ikke registrere invitasjonen.' }, 500);
    }

    const invitationUrl = new URL(redirectTo);
    invitationUrl.searchParams.set('token', token);
    invitationUrl.searchParams.set('organization', organizationId);

    const greeting = adminName ? `Hei ${adminName},` : 'Hei,';
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject: `Invitasjon til ${organizationName}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:auto">
            <h1 style="font-size:24px">Du er invitert</h1>
            <p>${greeting}</p>
            <p>Du er invitert som administrator for <strong>${organizationName}</strong> i Yasaflow.</p>
            <p><a href="${invitationUrl.toString()}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none">Godta invitasjonen</a></p>
            <p style="font-size:13px;color:#6b7280">Lenken utløper om 72 timer. Har du ikke forventet denne e-posten, kan du ignorere den.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('Resend failed', emailError);
      await adminClient
        .from('organization_invitations')
        .update({ status: 'failed', error_message: emailError })
        .eq('id', invitation.id);
      return json({ error: 'Invitasjonen ble lagret, men e-posten kunne ikke sendes.' }, 502);
    }

    await adminClient
      .from('organization_invitations')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', invitation.id);

    await adminClient
      .from('organization_admins')
      .upsert(
        {
          organization_id: organizationId,
          display_name: adminName || adminEmail,
          email: adminEmail,
          role: 'admin',
          invitation_status: 'invited',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,email' },
      );

    return json({
      invitationId: invitation.id,
      email: adminEmail,
      expiresAt,
      status: 'sent',
    });
  } catch (error) {
    console.error('Unhandled invitation error', error);
    return json({ error: 'En uventet feil oppstod under invitasjonen.' }, 500);
  }
});
