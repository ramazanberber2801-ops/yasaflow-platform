import { useCallback, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './pages/AdminPanel';
import { DonationModal } from './components/DonationModal';
import { InstallButton } from './components/InstallButton';
import { InstallGuideModal } from './components/InstallGuideModal';
import { HomePage } from './pages/HomePage';
import { ContactPage } from './pages/ContactPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { CalendarPage } from './pages/CalendarPage';
import { MorePage } from './pages/MorePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { supabase } from './lib/supabase';
import { useOrganizationModules } from './lib/moduleEngine';
import { DEFAULT_ORGANIZATION_ID } from './lib/organization';
import { getTheme } from './lib/themeEngine';
import { isPushMessageRead, loadActivePushMessages } from './lib/notificationCenter';
import type { Page } from './types';
import type { BrowserType, Platform } from './lib/browserDetect';

const NAVIGATION_RELEASE = '2026-07-17-navigation-v2';

function safeColor(value: unknown, fallback: string) {
  const color = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function contrastText(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.58 ? '#2D2A26' : '#FFFFFF';
}

function AppContent() {
  const { isAdmin, isInitialized, settings } = useApp();
  const { enabled } = useOrganizationModules(DEFAULT_ORGANIZATION_ID);
  const [page, setPage] = useState<Page>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [guideBrowser, setGuideBrowser] = useState<BrowserType>('safari');
  const [guidePlatform, setGuidePlatform] = useState<Platform>('ios');
  const [themeId, setThemeId] = useState('yasaflow-standard');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [initialNotificationId, setInitialNotificationId] = useState<string | null>(null);

  const selectedTheme = getTheme(themeId);
  const brandPrimary = safeColor(selectedTheme?.tokens.primary || settings?.brandingPrimaryColor, '#0A8DFF');
  const brandSecondary = safeColor(selectedTheme?.tokens.secondary || settings?.brandingSecondaryColor, '#071B53');
  const brandBackground = safeColor(selectedTheme?.tokens.background || settings?.brandingBackgroundColor, '#F4FAFF');
  const brandText = safeColor(selectedTheme?.tokens.text || settings?.brandingTextColor, '#071B53');
  const brandCard = safeColor(selectedTheme?.tokens.card, '#FFFFFF');
  const brandVars = {
    '--brand-primary': brandPrimary,
    '--brand-secondary': brandSecondary,
    '--brand-background': brandBackground,
    '--brand-text': brandText,
    '--brand-primary-text': contrastText(brandPrimary),
    '--brand-secondary-text': contrastText(brandSecondary),
    '--brand-card': brandCard,
    '--brand-card-text': brandText,
    '--brand-border': `color-mix(in srgb, ${brandPrimary} 20%, transparent)`,
    '--brand-muted-text': `color-mix(in srgb, ${brandText} 58%, transparent)`,
    '--brand-soft-text': `color-mix(in srgb, ${brandText} 72%, transparent)`,
    '--brand-subtle': `color-mix(in srgb, ${brandPrimary} 10%, ${brandCard})`,
    '--brand-surface': `color-mix(in srgb, ${brandBackground} 92%, #FFFFFF 8%)`,
  } as React.CSSProperties;

  const refreshUnread = useCallback(async () => {
    if (!enabled('push')) { setUnreadNotifications(0); return; }
    try {
      const messages = await loadActivePushMessages(DEFAULT_ORGANIZATION_ID);
      setUnreadNotifications(messages.filter((message) => !isPushMessageRead(message.id)).length);
    } catch {
      setUnreadNotifications(0);
    }
  }, [enabled]);

  useEffect(() => {
    document.documentElement.dataset.navigationRelease = NAVIGATION_RELEASE;
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!supabase) { setThemeLoaded(true); return; }
    supabase.from('organizations').select('theme_id').eq('id', DEFAULT_ORGANIZATION_ID).single().then(({ data }) => {
      if (data?.theme_id) setThemeId(data.theme_id);
      setThemeLoaded(true);
    });
  }, [isInitialized]);

  useEffect(() => {
    if (page === 'activities' && !enabled('activities', true)) setPage('home');
    if (page === 'notifications' && !enabled('push')) setPage('more');
  }, [page, enabled]);

  useEffect(() => {
    if (!isInitialized || !enabled('push')) return;
    const params = new URLSearchParams(window.location.search);
    const messageId = params.get('notification') || params.get('message_id');
    if (messageId) {
      setInitialNotificationId(messageId);
      setPage('notifications');
    }
    void refreshUnread();
    const handleRead = () => void refreshUnread();
    window.addEventListener('yasaflow-notifications-read', handleRead);
    return () => window.removeEventListener('yasaflow-notifications-read', handleRead);
  }, [isInitialized, enabled, refreshUnread]);

  const clearInitialNotification = () => {
    setInitialNotificationId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('notification');
    url.searchParams.delete('message_id');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    void refreshUnread();
  };

  const openAdmin = () => isAdmin ? setShowPanel(true) : setShowLogin(true);
  const openContact = () => enabled('contact') ? setPage('contact') : undefined;
  const openDonate = () => enabled('donation') ? setShowDonate(true) : undefined;
  const openNotifications = () => enabled('push') ? setPage('notifications') : undefined;
  const showGuide = (browser: BrowserType, platform: Platform) => { setGuideBrowser(browser); setGuidePlatform(platform); setShowInstallGuide(true); };

  if (!isInitialized || !themeLoaded) return <div className="flex min-h-screen items-center justify-center" style={{background:'#F4FAFF',color:'#071B53'}}><div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" aria-label="Loading" /></div>;

  return <div className="min-h-screen" style={{...brandVars,backgroundColor:'var(--brand-background)',color:'var(--brand-text)'}}>
    {page === 'home' && <HomePage />}
    {page === 'activities' && enabled('activities', true) && <ActivitiesPage />}
    {page === 'calendar' && <CalendarPage />}
    {page === 'more' && <MorePage onAdmin={openAdmin} onContact={openContact} onDonate={openDonate} onNotifications={openNotifications} unreadNotifications={unreadNotifications} />}
    {page === 'contact' && enabled('contact') && <ContactPage />}
    {page === 'notifications' && enabled('push') && <NotificationsPage initialMessageId={initialNotificationId} onConsumedInitialMessage={clearInitialNotification} />}

    <InstallButton onShowGuide={showGuide} />
    <BottomNav current={page === 'contact' || page === 'notifications' ? 'more' : page} onNavigate={setPage} unreadNotifications={unreadNotifications} />
    <AdminLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    <AdminPanel open={showPanel} onClose={() => setShowPanel(false)} />
    {enabled('donation') && <DonationModal open={showDonate} onClose={() => setShowDonate(false)} />}
    <InstallGuideModal open={showInstallGuide} onClose={() => setShowInstallGuide(false)} browser={guideBrowser} platform={guidePlatform} />
  </div>;
}

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}