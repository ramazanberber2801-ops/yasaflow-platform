import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

interface AppContextType {
  news: any[];
  staff: any[];
  sohbet: any[];
  settings: any;
  inspiration: any;
  admins: any[];
  currentAdmin: any | null;
  loading: boolean;
  isAdmin: boolean;
  isInitialized: boolean;
  login: (u: string, p: string, r?: string) => Promise<boolean>;
  logout: () => void;
  addNews: (item: any) => Promise<void>;
  updateNews: (id: string, item: any) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  addStaff: (item: any) => Promise<void>;
  updateStaff: (id: string, item: any) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addSohbet: (item: any) => Promise<void>;
  updateSohbet: (id: string, item: any) => Promise<void>;
  deleteSohbet: (id: string) => Promise<void>;
  sendSohbetReminder: (item: any) => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  updateInspiration: (updates: any) => Promise<void>;
  addAdmin: (admin: any) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  updateAdminPassword: (id: string, newPass: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ADMIN_SAFE_COLUMNS = 'id, username, display_name, role, auth_user_id';

const sanitizeAdmin = (admin: any | null) => {
  if (!admin) return null;

  const {
    password: _password,
    security_question: _securityQuestion,
    security_answer: _securityAnswer,
    ...safeAdmin
  } = admin;

  return {
    ...safeAdmin,
    displayName: safeAdmin.displayName || safeAdmin.display_name || safeAdmin.username,
  };
};

const getSavedAdmin = () => {
  try {
    const saved = localStorage.getItem('dtim_admin');
    return saved ? sanitizeAdmin(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedAdmin = getSavedAdmin();

  const [news, setNews] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [sohbet, setSohbet] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ vippsNumber: '29816' });
  const [inspiration, setInspiration] = useState<any>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any | null>(savedAdmin);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(!!savedAdmin);
  const [isInitialized] = useState(true);

  const mapSettingsFromDb = (row: any) => ({
    id: row.id,
    mosqueName: row.mosque_name || '',
    shortName: row.short_name || '',
    vippsNumber: row.vipps_number || '',
    address: row.address || '',
    mapUrl: row.map_url || '',
    phone: row.phone || '',
    whatsappNumber: row.whatsapp_number || '',
    bankAccount: row.bank_account || '',
    iban: row.iban || '',
    ramadanEnabled: row.ramadan_enabled || false,
    ramadanStartDate: row.ramadan_start_date || '',
    ramadanEndDate: row.ramadan_end_date || '',
    kurbanEnabled: row.kurban_enabled || false,
    kurbanStartDate: row.kurban_start_date || '',
  });

  const mapSettingsToDb = (s: any) => ({
    mosque_name: s.mosqueName || '',
    short_name: s.shortName || '',
    vipps_number: s.vippsNumber || '',
    address: s.address || '',
    map_url: s.mapUrl || '',
    phone: s.phone || '',
    whatsapp_number: s.whatsappNumber || '',
    bank_account: s.bankAccount || '',
    iban: s.iban || '',
    ramadan_enabled: !!s.ramadanEnabled,
    ramadan_start_date: s.ramadanStartDate || null,
    ramadan_end_date: s.ramadanEndDate || null,
    kurban_enabled: !!s.kurbanEnabled,
    kurban_start_date: s.kurbanStartDate || null,
  });

  const sendPush = async (title: string, body: string) => {
    try {
      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url: '/' }),
      });

      if (res.ok) {
        await trackEvent('push_sent', '', title);
      }
    } catch (e) {
      console.error('PUSH ERROR:', e);
    }
  };

  const sendSohbetReminder = async (item: any) => {
    await sendPush(
      `🔔 ${item.title}`,
      `${item.date} ${item.time} - ${item.speaker}`
    );
  };

  const loadAllData = async () => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [n, s, soh, insp, a, setRes] = await Promise.all([
        client.from('news').select('*').order('date', { ascending: false }),
        client.from('staff').select('*'),
        client
          .from('sohbet')
          .select('*')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true }),
        client.from('inspiration').select('*').limit(1).maybeSingle(),
        client.from('admins').select(ADMIN_SAFE_COLUMNS),
        client.from('settings').select('*').limit(1).maybeSingle(),
      ]);

      if (n.data) setNews(n.data);
      if (s.data) setStaff(s.data);
      if (soh.data) setSohbet(soh.data);
      if (insp.data) setInspiration(insp.data);
      if (a.data) setAdmins(a.data.map(sanitizeAdmin));
      if (setRes.data) setSettings(mapSettingsFromDb(setRes.data));
    } catch (e) {
      console.error('Veri yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const client = supabase;
    if (!client) return false;

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData.user) {
      console.error('Admin auth login failed:', authError);
      return false;
    }

    const { data: adminData, error: adminError } = await client
      .from('admins')
      .select(ADMIN_SAFE_COLUMNS)
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (!adminData || adminError) {
      console.error('Admin profile not found:', adminError);
      await client.auth.signOut();
      return false;
    }

    const safeAdmin = sanitizeAdmin(adminData);
    setCurrentAdmin(safeAdmin);
    setIsAdmin(true);
    localStorage.setItem('dtim_admin', JSON.stringify(safeAdmin));
    return true;
  };

  const logout = () => {
    if (supabase) void supabase.auth.signOut();
    localStorage.removeItem('dtim_admin');
    setIsAdmin(false);
    setCurrentAdmin(null);
  };

  const addNews = async (item: any) => {
    const client = supabase;
    if (!client) return;

    const shouldSendPush = item._sendPush === true;
    const cleanItem = { ...item };
    delete cleanItem._sendPush;

    const { error } = await client.from('news').insert([cleanItem]);

    if (error) {
      alert('Haber eklenemedi: ' + error.message);
      return;
    }

    if (shouldSendPush) await sendPush('Yeni Duyuru', cleanItem.title || 'Yeni haber yayınlandı');
    await loadAllData();
  };

  const updateNews = async (id: string, item: any) => {
    const client = supabase;
    if (!client) return;

    const shouldSendPush = item._sendPush === true;
    const cleanItem = { ...item };
    delete cleanItem._sendPush;

    const { error } = await client.from('news').update(cleanItem).eq('id', id);

    if (error) {
      alert('Haber güncellenemedi: ' + error.message);
      return;
    }

    if (shouldSendPush) await sendPush('Duyuru Güncellendi', cleanItem.title || 'Bir duyuru güncellendi');
    await loadAllData();
  };

  const deleteNews = async (id: string) => {
    const client = supabase;
    if (!client) return;
    await client.from('news').delete().eq('id', id);
    await loadAllData();
  };

  const addStaff = async (item: any) => {
    const client = supabase;
    if (!client) return;
    await client.from('staff').insert([item]);
    await loadAllData();
  };

  const updateStaff = async (id: string, item: any) => {
    const client = supabase;
    if (!client) return;
    await client.from('staff').update(item).eq('id', id);
    await loadAllData();
  };

  const deleteStaff = async (id: string) => {
    const client = supabase;
    if (!client) return;
    await client.from('staff').delete().eq('id', id);
    await loadAllData();
  };

  const addSohbet = async (item: any) => {
    const client = supabase;
    if (!client) return;

    const shouldSendPush = item._sendPush === true;
    const cleanItem = { ...item };
    delete cleanItem._sendPush;

    const { error } = await client.from('sohbet').insert([cleanItem]);

    if (error) {
      alert('Sohbet eklenemedi: ' + error.message);
      return;
    }

    if (shouldSendPush) await sendPush('Yeni Sohbet / Ders', cleanItem.title || 'Yeni program yayınlandı');
    await loadAllData();
  };

  const updateSohbet = async (id: string, item: any) => {
    const client = supabase;
    if (!client) return;

    const shouldSendPush = item._sendPush === true;
    const cleanItem = { ...item };
    delete cleanItem._sendPush;

    const { error } = await client.from('sohbet').update(cleanItem).eq('id', id);

    if (error) {
      alert('Sohbet güncellenemedi: ' + error.message);
      return;
    }

    if (shouldSendPush) await sendPush('Sohbet / Ders Güncellendi', cleanItem.title || 'Bir program güncellendi');
    await loadAllData();
  };

  const deleteSohbet = async (id: string) => {
    const client = supabase;
    if (!client) return;
    await client.from('sohbet').delete().eq('id', id);
    await loadAllData();
  };

  const updateSettings = async (s: any) => {
    setSettings(s);

    const client = supabase;
    if (!client) return;

    const dbSettings = mapSettingsToDb(s);
    const id = s.id || 1;

    await client.from('settings').update(dbSettings).eq('id', id);
    await loadAllData();
  };

  const updateInspiration = async (updates: any) => {
    const client = supabase;
    if (!client || !inspiration?.id) return;
    await client.from('inspiration').update(updates).eq('id', inspiration.id);
    await loadAllData();
  };

  const addAdmin = async (admin: any) => {
    const client = supabase;
    if (!client) return;

    const cleanAdmin = {
      id: admin.id,
      username: admin.username,
      display_name: admin.display_name || admin.displayName || admin.username,
      role: admin.role || 'admin',
      auth_user_id: admin.auth_user_id || null,
    };

    const { error } = await client.from('admins').insert([cleanAdmin]);

    if (error) {
      alert('Admin eklenemedi: ' + error.message);
      return;
    }

    await loadAllData();
  };

  const deleteAdmin = async (id: string) => {
    const client = supabase;
    if (!client) return;
    await client.from('admins').delete().eq('id', id);
    await loadAllData();
  };

  const updateAdminPassword = async (_id: string, newPass: string) => {
    const client = supabase;
    if (!client) return;

    const { error } = await client.auth.updateUser({ password: newPass });

    if (error) {
      alert('Şifre güncellenemedi: ' + error.message);
      return;
    }
  };

  return (
    <AppContext.Provider
      value={{
        news,
        staff,
        sohbet,
        settings,
        inspiration,
        admins,
        currentAdmin,
        loading,
        isAdmin,
        isInitialized,
        login,
        logout,
        addNews,
        updateNews,
        deleteNews,
        addStaff,
        updateStaff,
        deleteStaff,
        addSohbet,
        updateSohbet,
        deleteSohbet,
        sendSohbetReminder,
        updateSettings,
        updateInspiration,
        addAdmin,
        deleteAdmin,
        updateAdminPassword,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp, AppProvider içinde kullanılmalı');
  return context;
};
