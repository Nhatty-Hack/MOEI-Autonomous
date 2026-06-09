interface HeaderProps {
  applicationCount: number;
}

/* Simplified UAE coat of arms — golden falcon with flag shield */
function UAEEagle({ size = 48 }: { size?: number }) {
  const w = size;
  const h = size * 1.1;
  return (
    <svg width={w} height={h} viewBox="0 0 46 52" fill="none" aria-label="UAE Coat of Arms">
      {/* Left wing upper */}
      <path d="M14 21 C9 15 2 18 2 27 C7 26 12 24 14 27Z" fill="#C8922A" />
      {/* Left wing lower */}
      <path d="M14 27 C8 28 4 34 6 40 C10 37 13 32 14 32Z" fill="#C8922A" />
      {/* Right wing upper */}
      <path d="M32 21 C37 15 44 18 44 27 C39 26 34 24 32 27Z" fill="#C8922A" />
      {/* Right wing lower */}
      <path d="M32 27 C38 28 42 34 40 40 C36 37 33 32 32 32Z" fill="#C8922A" />
      {/* Body */}
      <ellipse cx="23" cy="28" rx="8" ry="11" fill="#C8922A" />
      {/* Head */}
      <circle cx="23" cy="13" r="6.5" fill="#C8922A" />
      {/* Hooked beak */}
      <path d="M19.5 16 Q23 22 23 22 Q26.5 22 26.5 16Z" fill="#7A5008" />
      {/* Eye */}
      <circle cx="21" cy="11" r="1.4" fill="#1A0A00" />
      {/* Chest shield */}
      <rect x="17.5" y="24" width="11" height="14" rx="1" fill="#FFFFFF" />
      {/* UAE flag — red vertical bar */}
      <rect x="17.5" y="24" width="3.2" height="14" fill="#EF3340" />
      {/* Green stripe */}
      <rect x="20.7" y="24"   width="7.8" height="4.7" fill="#00732F" />
      {/* White stripe */}
      <rect x="20.7" y="28.7" width="7.8" height="4.6" fill="#FFFFFF" />
      {/* Black stripe */}
      <rect x="20.7" y="33.3" width="7.8" height="4.7" fill="#1A1A1A" />
      {/* Talons */}
      <line x1="18" y1="39" x2="15" y2="47" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20.5" y1="40" x2="19.5" y2="48" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="23" y1="40" x2="23"  y2="49" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25.5" y1="40" x2="26.5" y2="48" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="39" x2="31" y2="47" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Base ribbon */}
      <rect x="11" y="47" width="24" height="5" rx="2" fill="#C8922A" />
    </svg>
  );
}

export default function Header({ applicationCount }: HeaderProps) {
  return (
    <header style={{ width: '100%', display: 'block', position: 'relative', zIndex: 40 }}>
      {/* ── Main white header bar ─────────────────────────────────── */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E0D0' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: eagle + ministry name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <UAEEagle size={50} />
            <div style={{ borderLeft: '1px solid #E8E0D0', paddingLeft: '14px' }}>
              <div
                dir="rtl"
                className="arabic"
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  lineHeight: 1.25,
                  letterSpacing: '0.01em',
                }}
              >
                وزارة الطاقة والبنية التحتية
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#555555',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  marginTop: '2px',
                }}
              >
                Ministry of Energy &amp; Infrastructure
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#C8922A',
                  fontWeight: 600,
                  marginTop: '2px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                United Arab Emirates
              </div>
            </div>
          </div>

          {/* Right: case count + language toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                backgroundColor: '#F5F0E8',
                border: '1px solid #E8E0D0',
                borderRadius: '8px',
                padding: '8px 16px',
                textAlign: 'center',
                minWidth: '68px',
              }}
            >
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#C8922A',
                  lineHeight: 1,
                  fontFamily: "'Roboto', monospace",
                }}
              >
                {applicationCount}
              </div>
              <div
                style={{
                  fontSize: '9.5px',
                  color: '#888888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: '2px',
                  fontWeight: 500,
                }}
              >
                Cases
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                border: '1px solid #E8E0D0',
                borderRadius: '6px',
                overflow: 'hidden',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#C8922A',
                  color: '#FFFFFF',
                  cursor: 'default',
                }}
              >
                EN
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  color: '#555555',
                  cursor: 'pointer',
                  backgroundColor: '#FFFFFF',
                }}
              >
                AR
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SZHP subtitle / portal identity strip ────────────────── */}
      <div style={{ backgroundColor: '#EDE8DE', borderBottom: '1px solid #E8E0D0' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '9px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '3px',
                height: '22px',
                backgroundColor: '#C8922A',
                borderRadius: '2px',
                flexShrink: 0,
              }}
            />
            <div>
              <span style={{ fontWeight: 600, fontSize: '13px', color: '#1A1A1A' }}>
                Sheikh Zayed Housing Programme
              </span>
              <span style={{ color: '#D4C5A9', margin: '0 8px' }}>|</span>
              <span
                dir="rtl"
                className="arabic"
                style={{ fontSize: '13px', color: '#555555' }}
              >
                برنامج الشيخ زايد للإسكان
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#00704A',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '11px', color: '#555555' }}>System Online</span>
            <span style={{ color: '#D4C5A9', margin: '0 6px' }}>·</span>
            <span style={{ fontSize: '11px', color: '#555555' }}>
              Arrears Rescheduling Portal
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
