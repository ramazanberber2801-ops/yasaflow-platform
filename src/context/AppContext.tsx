import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Veya projenizdeki supabase dosya yolu

// Veri yapısı arayüzü
interface DailyData {
  verse_text: string | null;
  verse_reference: string | null;
  hadith_text: string | null;
  hadith_source: string | null;
}

interface AppContextType {
  dailyData: DailyData | null;
  loading: boolean;
  fetchInspiration: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInspiration = async () => {
    try {
      setLoading(true);
      
      // Bugünün yılın kaçıncı günü olduğunu hesapla
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      const { data, error } = await supabase
        ?._from('inspiration')
        .select('verse_text, verse_reference, hadith_text, hadith_source')
        .eq('day_of_year', dayOfYear)
        .single();

      if (error) throw error;
      
      if (data) {
        setDailyData(data);
      } else {
        setDailyData(null);
      }
    } catch (error) {
      console.error("fetchInspiration hatası:", error);
      setDailyData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspiration();
  }, []);

  return (
    <AppContext.Provider value={{ dailyData, loading, fetchInspiration }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp mutlaka an AppProvider içinde kullanılmalıdır');
  }
  return context;
};
