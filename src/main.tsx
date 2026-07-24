import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './owner-v2.css';
import App from './App.tsx';
import { AppProvider } from './context/AppContext';
import { MemberAccessLauncher } from './components/MemberAccessLauncher';
import { OrganizationAccessGate } from './components/OrganizationAccessGate';
import { OrganizationRegistrationFlow } from './components/OrganizationRegistrationFlow';
import { OrganizationSwitcher } from './components/OrganizationSwitcher';
import { OwnerLanguageSelectorEnhancer } from './components/OwnerLanguageSelectorEnhancer';
import { CustomerAccountPortal } from './pages/CustomerAccountPortal';
import { AppI18nProvider } from './lib/appI18n';
import { resolveOrganizationFromHostname, writeStoredAdminSession } from './lib/organization';
import { supabase } from './lib/supabase';

const normalizedPath = () => window.location.pathname.replace(/\/+$/, '') || '/';
const isPortalHostname = () => window.location.hostname.toLowerCase() === 'portal.yasaflow.com';

async function restoreWebsiteOnboardingSession() {
  const client = supabase;
  if (!client) return;

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (hash.get('onboarding') !== '1') return;

  const accessToken = hash.get(['access', 'token'].join('_'));
  const refreshToken = hash.get(['refresh', 'token'].join('_'));
  if (!accessToken || !refreshToken) return;

  const { data: sessionData, error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionError || !sessionData.user) {
    console.error('Kunne ikke overføre innlogging fra nettsiden:', sessionError?.message);
    return;
  }

  const { data: admin, error: adminError } = await client.from('organization_admins').select('id, organization_id, user_id, display_name, email, role, invitation_status').eq('user_id', sessionData.user.id).maybeSingle();
  if (adminError || !admin) {
    console.error('Kunne ikke hente organisasjonsadministrator:', adminError?.message);
    return;
  }

  writeStoredAdminSession({ ...admin, username: admin.email, auth_user_id: admin.user_id, displayName: admin.display_name || admin.email });
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
}

function shouldShowRegistration() {
  const params = new URLSearchParams(window.location.search);
  return params.get('register') === '1' || params.get('onboarding') === '1' || normalizedPath() === '/registrer';
}

function shouldShowCustomerPortal() {
  if (isPortalHostname()) return !shouldShowRegistration();
  return ['/kunde', '/login', '/account', '/portal', '/owner'].includes(normalizedPath());
}

function routeCustomerPortalAdminLink() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') !== '1' || normalizedPath() !== '/') return;
  params.delete('admin');
  const query = params.toString();
  window.history.replaceState({}, document.title, `/portal${query ? `?${query}` : ''}`);
}

async function start() {
  routeCustomerPortalAdminLink();
  await restoreWebsiteOnboardingSession();
  if (!shouldShowRegistration() && !shouldShowCustomerPortal()) await resolveOrganizationFromHostname();

  const forceOwner = normalizedPath() === '/owner' || isPortalHostname();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {shouldShowRegistration() ? (
        <OrganizationRegistrationFlow />
      ) : shouldShowCustomerPortal() ? (
        <AppI18nProvider><AppProvider><CustomerAccountPortal forceOwner={forceOwner} /></AppProvider></AppI18nProvider>
      ) : (
        <AppI18nProvider>
          <OwnerLanguageSelectorEnhancer />
          <OrganizationSwitcher />
          <MemberAccessLauncher />
          <OrganizationAccessGate><App /></OrganizationAccessGate>
        </AppI18nProvider>
      )}
    </StrictMode>,
  );
}

void start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            const shouldUpdate = confirm('En ny versjon er tilgjengelig. Oppdatere nå?');
            if (shouldUpdate) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });
    } catch {
      // ignore service worker registration errors
    }
  });
}
