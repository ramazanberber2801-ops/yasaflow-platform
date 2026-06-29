// ... (üst kısımlar aynı)

  const featuredNews = news.slice(0, 6);
  // Sohbet verisini güvenli hale getirdik ve değişkene aldık
  const upcomingSohbet = (sohbet || []).slice(0, 4);

  return (
    <div className="min-h-screen pb-28">
      {/* ... (Header ve diğer kısımlar aynı) ... */}

      {/* SOHBETLER BÖLÜMÜNÜ BURAYA EKLİYORUZ */}
      <section className="px-4 mt-5">
        <h2 className="font-serif text-lg mb-3">Sohbetler & Dersler</h2>
        {upcomingSohbet.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Henüz sohbet veya ders bulunmamaktadır.</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingSohbet.map((item) => (
              <button 
                key={item.id} 
                onClick={() => setSelectedSohbet(item)} 
                className="w-full bg-white rounded-xl border border-[#C5A880]/20 flex text-left p-2"
              >
                <div className="w-20 h-20 shrink-0 bg-[#C5A880]/10 rounded-lg flex items-center justify-center">
                  <BookOpen size={20} className="text-[#C5A880]/60" />
                </div>
                <div className="pl-3 py-1">
                  <h3 className="font-serif text-sm line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.date} • {item.speaker}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Haberler bölümü */}
      <section className="px-4 mt-5">
        <h2 className="font-serif text-lg mb-3">Haberler & Duyurular</h2>
        <div className="space-y-2.5">
          {featuredNews.map((item) => (
            <button key={item.id} onClick={() => setSelectedNews(item)} className="w-full bg-white rounded-xl border border-[#C5A880]/20 flex text-left p-2">
              {(item.imageBase64 || item.image_base64) ? (
                <div className="w-20 h-20 shrink-0 overflow-hidden rounded-lg">
                  <img src={item.imageBase64 || item.image_base64} alt={item.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 shrink-0 bg-[#C5A880]/10 rounded-lg flex items-center justify-center">
                  <Newspaper size={20} className="text-[#C5A880]/40" />
                </div>
              )}
              <div className="pl-3 py-1">
                <h3 className="font-serif text-sm line-clamp-2">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.content}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
      <SohbetModal item={selectedSohbet} onClose={() => setSelectedSohbet(null)} />
    </div>
  );
}
