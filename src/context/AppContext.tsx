// ... (behold imports og interface uendret)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... (behold state og hjelpefunksjoner frem til addSohbet)

  const addNews = async (item: any) => {
    const client = supabase;
    if (!client) return;
    const { error } = await client.from('news').insert([item]);
    if (error) alert('Haber eklenemedi: ' + error.message);
    else await loadAllData();
  };

  const addSohbet = async (item: any) => {
    const client = supabase;
    if (!client) return;

    // Håndter logikk for push-varsling hvis den finnes
    const shouldSendPush = item._sendPush === true;
    const cleanItem = { ...item };
    delete cleanItem._sendPush;

    const { error } = await client.from('sohbet').insert([cleanItem]);

    if (error) {
      console.error('SOHBET INSERT ERROR:', error);
      alert('Sohbet eklenemedi: ' + error.message);
      return;
    }

    if (shouldSendPush) {
      await sendPush('Yeni Sohbet / Ders', cleanItem.title || 'Yeni program yayınlandı');
    }

    await loadAllData();
  };

  // ... (resten av funksjonene: updateNews, deleteNews, addStaff, etc.)

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
        addNews, // Nå er denne definert!
        updateNews,
        deleteNews,
        addStaff,
        updateStaff,
        deleteStaff,
        addSohbet, // Nå er denne kun definert én gang
        updateSohbet,
        deleteSohbet,
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
