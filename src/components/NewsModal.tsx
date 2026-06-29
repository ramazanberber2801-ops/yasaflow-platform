{/* Scrollable content */}
<div className="overflow-y-auto flex-1">
  {(item.imageBase64 || item.image_base64) && (
    <img
      src={item.imageBase64 || item.image_base64}
      alt={item.title}
      className="w-full h-auto object-contain block"
    />
  )}

  <div className="p-5 sm:p-6">
    <h2 className="font-serif text-xl sm:text-2xl text-[#2D2A26] leading-tight mb-3">
      {item.title}
    </h2>

    <div className="flex items-center gap-3 text-xs text-[#2D2A26]/50 mb-4">
      <span className="flex items-center gap-1">
        <Calendar size={13} />
        {formattedDate}
      </span>
    </div>

    <div className="prose prose-sm max-w-none">
      <p className="text-[#2D2A26]/80 leading-relaxed whitespace-pre-wrap">
        {item.content}
      </p>
    </div>
  </div>
</div>
