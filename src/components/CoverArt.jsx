/**
 * 唱片封面 + 毛玻璃光暈陰影
 * 在封面下方投射一層放大模糊的封面複本，形成隨封面顏色變化的柔光陰影
 * （類似 Apple Music / Sony Music 的封面浮起效果）
 */
export default function CoverArt({ src, alt = '', icon: Icon, iconSize = 32, rounded = 'rounded-lg', aspect = 'aspect-square' }) {
  return (
    <div className={`relative ${aspect}`}>
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover ${rounded} pointer-events-none`}
          style={{ filter: 'blur(22px) saturate(1.5)', transform: 'translateY(9%) scale(0.92)', opacity: 0.55 }}
        />
      )}
      <div className={`absolute inset-0 ${rounded} overflow-hidden bg-gray-100`}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {Icon && <Icon size={iconSize} className="text-gray-300" />}
          </div>
        )}
      </div>
    </div>
  )
}
