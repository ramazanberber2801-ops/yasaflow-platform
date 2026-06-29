import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { NewsItem, StaffMember, SohbetItem, MosqueSettings, AdminAccount, DailyInspiration } from '../types';
import { loadFromStorage, saveToStorage, removeFromStorage, loadFromSessionStorage, saveToSessionStorage, removeFromSessionStorage, STORAGE_KEYS } from '../lib/storage';
import { DEFAULT_SETTINGS, DEFAULT_ADMINS } from '../lib/constants';
import * as db from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';

// ── Session ──────────────────────────────────────────────────

interface SessionData {
  active: boolean;
  admin: AdminAccount | null;
  remember: boolean;
}

// ── Context shape ────────────────────────────────────────────

interface AppContextValue {
  // Data
  news: NewsItem[];
  staff: StaffMember[];
  sohbet: SohbetItem[];
  settings: MosqueSettings;
  inspiration: DailyInspiration;
  admins: AdminAccount[];
  isAdmin: boolean;
  currentAdmin: AdminAccount | null;
  isInitialized: boolean;
  isSupabaseReady: boolean;

  // Auth
  login: (username: string, password: string, rememberMe: boolean) => boolean;
  logout: () => void;
  addAdmin: (admin: Omit<AdminAccount, 'id'>) => { success: boolean; error?: string };
  deleteAdmin: (id: string) => void;
  updateAdminPassword: (username: string, newPassword: string) => void;

  // Settings
  updateSettings: (updates: Partial<MosqueSettings>) => void;
  updateInspiration: (updates: Partial<DailyInspiration>) => void;

  // News CRUD
  addNews: (item: Omit<NewsItem, 'id' | 'date'>) => void;
  updateNews: (id: string, updates: Partial<NewsItem>) => void;
  deleteNews: (id: string) => void;

  // Staff CRUD
  addStaff: (member: Omit<StaffMember, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;

  // Sohbet CRUD
  addSohbet: (item: Omit<SohbetItem, 'id'>) => void;
  updateSohbet: (id: string, updates: Partial<SohbetItem>) => void;
  deleteSohbet: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  // ── State ──────────────────────────────────────────────────
  const [news, setNews] = useState<NewsItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [sohbet, setSohbet] = useState<SohbetItem[]>([]);
  const [settings, setSettings] = useState<MosqueSettings>(DEFAULT_SETTINGS);
  const [inspiration, setInspiration] = useState<DailyInspiration>({
    verseText: '', verseReference: '', hadithText: '', hadithSource: '', published: true,
  });
  const [admins, setAdmins] = useState<AdminAccount[]>(DEFAULT_ADMINS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupabaseReady] = useState(isSupabaseConfigured);

  // Verileri yenilemek için ortak bir fonksiyon (CRUD işlemlerinden sonra çağrılacak)
  const refreshAllData = useCallback(async () => {
    try {
      const [newsData, sohbetData, staffData, settingsData, inspData, adminsData] = await Promise.all([
        db.fetchNews(),
        db.fetchSohbet(),
        db.fetchStaff(),
        db.fetchSettings(),
        db.fetchInspiration(),
        db.fetchAdmins(),
      ]);

      setNews(newsData);
      setSohbet(sohbetData);
      setStaff(staffData);
      setSettings(settingsData);
      setInspiration(inspData);
      setAdmins(adminsData);
      return adminsData;
    } catch (err) {
      console.error("Veriler güncellenirken hata oluştu:", err);
      return [];
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      const adminsData = await refreshAllData();

      if (!mounted) return;

      // Restore admin session
      const persistentSession = loadFromStorage<SessionData>(STORAGE_KEYS.SESSION, { active: false, admin: null, remember: false });
      if (persistentSession.active && persistentSession.admin && persistentSession.remember) {
        const stillExists = adminsData.some(a => a.id === persistentSession.admin!.id);
        if (stillExists) {
          setIsAdmin(true);
          setCurrentAdmin(persistentSession.admin);
        } else {
          removeFromStorage(STORAGE_KEYS.SESSION);
        }
      } else {
        const tempSession = loadFromSessionStorage<SessionData>(STORAGE_KEYS.SESSION, { active: false, admin: null, remember: false });
        if (tempSession.active && tempSession.admin) {
          const stillExists = adminsData.some(a => a.id === tempSession.admin!.id);
          if (stillExists) {
            setIsAdmin(true);
            setCurrentAdmin(tempSession.admin);
          } else {
            removeFromSessionStorage(STORAGE_KEYS.SESSION);
          }
        }
      }

      setIsInitialized(true);
    }

    init();

    return () => { mounted = false; };
  }, [refreshAllData]);

  // ── Auth ──────────────────────────────────────────────────
  const login = useCallback((username: string, password: string, rememberMe: boolean): boolean => {
    const found = admins.find(
      a => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password
    );
    if (found) {
      setIsAdmin(true);
      setCurrentAdmin(found);
      const sessionData: SessionData = { active: true, admin: found, remember: rememberMe };
      if (rememberMe) {
        saveToStorage(STORAGE_KEYS.SESSION, sessionData);
        removeFromSessionStorage(STORAGE_KEYS.SESSION);
      } else {
        saveToSessionStorage(STORAGE_KEYS.SESSION, sessionData);
        removeFromStorage(STORAGE_KEYS.SESSION);
      }
      return true;
    }
    return false;
  }, [admins]);

  const logout = useCallback(() => {
    setIsAdmin(false);
    setCurrentAdmin(null);
    removeFromStorage(STORAGE_KEYS.SESSION);
    removeFromSessionStorage(STORAGE_KEYS.SESSION);
  }, []);

  const addAdmin = useCallback((admin: Omit<AdminAccount, 'id'>): { success: boolean; error?: string } => {
    const exists = admins.some(a => a.username.toLowerCase() === admin.username.toLowerCase());
    if (exists) {
      return { success: false, error: 'Bu kullanıcı adı zaten mevcut.' };
    }
    const newAdmin: AdminAccount = { ...admin, id: genId('admin'), role: 'admin' };
    setAdmins(prev => [...prev, newAdmin]);
    db.insertAdmin(newAdmin).then(() => refreshAllData());
    return { success: true };
  }, [admins, refreshAllData]);

  const deleteAdmin = useCallback((id: string) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
    db.deleteAdmin(id).then(() => refreshAllData());
  }, [refreshAllData]);

  const updateAdminPassword = useCallback((username: string, newPassword: string) => {
    setAdmins(prev => prev.map(a => {
      if (a.username.toLowerCase() === username.toLowerCase()) {
        const updated = { ...a, password: newPassword };
        if (currentAdmin && a.id === currentAdmin.id) {
          setCurrentAdmin(updated);
          const remember = loadFromStorage<SessionData>(STORAGE_KEYS.SESSION, { active: false, admin: null, remember: false }).remember;
          if (remember) {
            saveToStorage(STORAGE_KEYS.SESSION, { active: true, admin: updated, remember: true });
          } else {
            saveToSessionStorage(STORAGE_KEYS.SESSION, { active: true, admin: updated, remember: false });
          }
        }
        return updated;
      }
      return a;
    }));
    db.updateAdminPassword(username, newPassword).then(() => refreshAllData());
  }, [currentAdmin, refreshAllData]);

  // ── Settings ──────────────────────────────────────────────
  const updateSettings = useCallback((updates: Partial<MosqueSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      db.upsertSettings(next).then(() => refreshAllData());
      return next;
    });
  }, [refreshAllData]);

  const updateInspiration = useCallback((updates: Partial<DailyInspiration>) => {
    setInspiration(prev => {
      const next = { ...prev, ...updates };
      db.upsertInspiration(next).then(() => refreshAllData());
      return next;
    });
  }, [refreshAllData]);

  // ── News CRUD ─────────────────────────────────────────────
  const addNews = useCallback((item: Omit<NewsItem, 'id' | 'date'>) => {
    const newItem: NewsItem = { ...item, id: genId('news'), date: new Date().toISOString() };
    setNews(prev => [newItem, ...prev]);
    db.insertNews(newItem).then(() => refreshAllData());
  }, [refreshAllData]);

  const updateNews = useCallback((id: string, updates: Partial<NewsItem>) => {
    setNews(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    db.updateNews(id, updates).then(() => refreshAllData());
  }, [refreshAllData]);

  const deleteNews = useCallback((id: string) => {
    setNews(prev => {
      const item = prev.find(n => n.id === id);
      if (item?.imageBase64) item.imageBase64 = undefined;
      return prev.filter(n => n.id !== id);
    });
    db.deleteNews(id).then(() => refreshAllData());
  }, [refreshAllData]);

  // ── Staff CRUD ────────────────────────────────────────────
  const addStaff = useCallback((member: Omit<StaffMember, 'id'>) => {
    const newMember: StaffMember = { ...member, id: genId('staff') };
    setStaff(prev => [...prev, newMember]);
    db.insertStaff(newMember).then(() => refreshAllData());
  }, [refreshAllData]);

  const updateStaff = useCallback((id: string, updates: Partial<StaffMember>) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    db.updateStaff(id, updates).then(() => refreshAllData());
  }, [refreshAllData]);

  const deleteStaff = useCallback((id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    db.deleteStaff(id).then(() => refreshAllData());
  }, [refreshAllData]);

  // ── Sohbet CRUD ───────────────────────────────────────────
  const addSohbet = useCallback((item: Omit<SohbetItem, 'id'>) => {
    const newItem: SohbetItem = { ...item, id: genId('sohbet') };
    setSohbet(prev => [newItem, ...prev]);
    db.insertSohbet(newItem).then(() => refreshAllData());
  }, [refreshAllData]);

  const updateSohbet = useCallback((id: string, updates: Partial<SohbetItem>) => {
    setSohbet(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    db.updateSohbet(id, updates).then(() => refreshAllData());
  }, [refreshAllData]);

  const deleteSohbet = useCallback((id: string) => {
    setSohbet(prev => {
      const item = prev.find(s => s.id === id);
      if (item?.imageBase64) item.imageBase64 = undefined;
      return prev.filter(s => s.id !== id);
    });
    db.deleteSohbet(id).then(() => refreshAllData());
  }, [refreshAllData]);

  return (
    <AppContext.Provider value={{
      news, staff, sohbet, settings, inspiration, admins,
      isAdmin, currentAdmin, isInitialized, isSupabaseReady,
      login, logout, addAdmin, deleteAdmin, updateAdminPassword,
      updateSettings, updateInspiration,
      addNews, updateNews, deleteNews,
      addStaff, updateStaff, deleteStaff,
      addSohbet, updateSohbet, deleteSohbet,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
