import React from 'react';

// Default vector logos disabled as per user instruction (HAPUS SEMUA LOGO DEFAULT)
// Only custom uploaded logos will be rendered
export const KemenagLogo: React.FC<{ className?: string }> = () => {
  return null;
};

// Madrasah Emblem / Logo
export const MadrasahLogo: React.FC<{ className?: string }> = () => {
  return null;
};

// Islamic Security Watermark Pattern (Rub el Hizb 8-pointed star & Arabesque)
export const IslamicWatermark: React.FC<{ pattern?: string; className?: string }> = ({
  pattern = 'islamic-star',
  className = 'absolute inset-0 pointer-events-none opacity-[0.06]'
}) => {
  if (pattern === 'none') return null;

  return (
    <div className={`overflow-hidden ${className}`}>
      {pattern === 'islamic-star' && (
        <svg className="w-full h-full" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
          <g fill="currentColor" opacity="0.9">
            {/* Repeating Islamic geometric octagrams */}
            {[20, 60, 100, 140, 180].map((cx) =>
              [20, 60, 100].map((cy) => (
                <g key={`${cx}-${cy}`} transform={`translate(${cx}, ${cy}) scale(0.65)`}>
                  <rect x="-15" y="-15" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="-15" y="-15" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(45)" />
                  <circle cx="0" cy="0" r="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="0" cy="0" r="3" fill="currentColor" />
                </g>
              ))
            )}
          </g>
        </svg>
      )}

      {pattern === 'guilloche' && (
        <svg className="w-full h-full" viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.8">
            {Array.from({ length: 14 }).map((_, i) => (
              <ellipse
                key={i}
                cx="150"
                cy="90"
                rx={40 + i * 9}
                ry={20 + i * 6}
                transform={`rotate(${i * 13} 150 90)`}
              />
            ))}
          </g>
        </svg>
      )}

      {pattern === 'arabesque' && (
        <svg className="w-full h-full" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,0 C50,40 50,-40 100,0 C150,40 150,-40 200,0 C250,40 250,-40 300,0 M0,40 C50,80 50,0 100,40 C150,80 150,0 200,40 M0,80 C50,120 50,40 100,80 C150,120 150,40 200,80"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        </svg>
      )}

      {pattern === 'batik-kemenag' && (
        <svg className="w-full h-full" viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="batik-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="10" cy="10" r="3" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#batik-pattern)" />
        </svg>
      )}
    </div>
  );
};

// Barcode SVG Generator for Clean Crisp ID Card Rendering
export const BarcodeSvg: React.FC<{ value: string; className?: string; height?: number }> = ({
  value,
  className = 'w-full',
  height = 28
}) => {
  // Generate deterministic barcode lines based on value hash
  const sanitized = value.replace(/[^0-9A-Z]/gi, '') || '0123456789';
  const bars: { width: number; isSpace: boolean }[] = [];
  
  // Guard start bar
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 2, isSpace: false });
  
  for (let i = 0; i < sanitized.length; i++) {
    const charCode = sanitized.charCodeAt(i);
    const pattern = [(charCode % 3) + 1, ((charCode >> 1) % 2) + 1, ((charCode >> 2) % 3) + 1, ((charCode >> 3) % 2) + 1];
    
    pattern.forEach((w, idx) => {
      bars.push({ width: w, isSpace: idx % 2 === 1 });
    });
  }

  // Guard stop bar
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 3, isSpace: false });

  const totalUnits = bars.reduce((acc, b) => acc + b.width, 0);
  let currentX = 0;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalUnits * 2} ${height}`}
        className="w-full h-7 block"
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width * 2;
          if (bar.isSpace) return null;
          return (
            <rect
              key={idx}
              x={x}
              y="0"
              width={bar.width * 2}
              height={height}
              fill="#1e293b"
            />
          );
        })}
      </svg>
      <span className="font-mono text-[9px] font-bold tracking-widest text-slate-700 leading-none mt-0.5">
        *{value}*
      </span>
    </div>
  );
};

// Security Hologram Badge
export const HologramBadge: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <div
      className={`relative ${className} rounded-full overflow-hidden flex items-center justify-center shadow-inner border border-amber-300/60 bg-gradient-to-tr from-amber-200 via-rose-200 via-emerald-200 to-sky-300`}
      style={{
        boxShadow: 'inset 0 0 6px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.15)'
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/60 via-transparent to-black/10 opacity-75" />
      <svg viewBox="0 0 40 40" className="w-5 h-5 relative z-10 text-emerald-800" fill="currentColor">
        <path d="M20 4 L24 13 L33 14 L26 21 L29 30 L20 25 L11 30 L14 21 L7 14 L16 13 Z" fill="#047857" opacity="0.8" />
        <circle cx="20" cy="20" r="4" fill="#F59E0B" />
      </svg>
      <span className="absolute text-[5.5px] font-extrabold uppercase tracking-tighter text-slate-800/80 bottom-0.5 leading-none">
        ORIGINAL
      </span>
    </div>
  );
};

// Official School Stamp / Stempel Resmi Madrasah
export const OfficialStamp: React.FC<{
  schoolName: string;
  location: string;
  className?: string;
}> = ({ schoolName, location, className = 'w-24 h-24' }) => {
  // Truncate if long
  const cleanSchool = schoolName.toUpperCase();
  const cleanLoc = location.toUpperCase();

  return (
    <div className={`relative ${className} select-none pointer-events-none transform -rotate-12 opacity-80 mix-blend-multiply`}>
      <svg viewBox="0 0 120 120" className="w-full h-full text-violet-700">
        {/* Outer Circular Ring */}
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="500" />
        <circle cx="60" cy="60" r="51" fill="none" stroke="currentColor" strokeWidth="1.2" />
        
        {/* Inner Circle Ring */}
        <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.2" />
        
        {/* Curved Path for School Name */}
        <path id="topStampPath" d="M 18,60 A 42,42 0 1,1 102,60" fill="none" />
        <path id="bottomStampPath" d="M 102,60 A 42,42 0 0,1 18,60" fill="none" />

        <text fill="currentColor" fontSize="8" fontWeight="bold" letterSpacing="1.2">
          <textPath href="#topStampPath" startOffset="50%" textAnchor="middle">
            {cleanSchool.length > 25 ? cleanSchool.slice(0, 24) + '...' : cleanSchool}
          </textPath>
        </text>

        <text fill="currentColor" fontSize="7.5" fontWeight="bold" letterSpacing="1">
          <textPath href="#bottomStampPath" startOffset="50%" textAnchor="middle">
            ★ {cleanLoc} ★
          </textPath>
        </text>

        {/* Center Star & Logo */}
        <g transform="translate(60,60)">
          <path
            d="M 0,-12 L 3,-4 L 11,-4 L 5,1 L 7,9 L 0,4 L -7,9 L -5,1 L -11,-4 L -3,-4 Z"
            fill="currentColor"
          />
          <text
            x="0"
            y="14"
            fill="currentColor"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
          >
            KEMENAG
          </text>
        </g>
      </svg>
    </div>
  );
};

// Principal Signature / Tanda Tangan Kepala Madrasah
export const PrincipalSignature: React.FC<{ className?: string }> = ({ className = 'w-24 h-12' }) => {
  return (
    <div className={`relative ${className} select-none pointer-events-none flex items-center justify-center`}>
      <svg viewBox="0 0 120 60" className="w-full h-full text-blue-900" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15,42 Q25,12 40,25 T60,20 Q70,45 80,15 Q90,10 100,32 M45,28 Q75,30 95,25 M28,38 C35,48 55,42 70,40"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="102" cy="30" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
};
