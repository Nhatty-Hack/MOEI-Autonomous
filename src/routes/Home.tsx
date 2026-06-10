import { Link } from 'react-router-dom';
import { Shield, User } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--app-bg)' }}>
      {/* Gold top accent strip */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #C8922A 0%, #E8B44A 60%, #C8922A 100%)' }} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Logo */}
        <img
          src="/logo/logo.png"
          alt="MOEI"
          className="fade-up"
          style={{ height: '64px', width: 'auto', marginBottom: '32px' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Titles */}
        <div className="text-center mb-2 fade-up" style={{ animationDelay: '50ms' }}>
          <h1 className="rtl" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
            نظام إعادة جدولة المتأخرات الذاتي
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>MOEI Autonomous Arrears Rescheduling System</p>
          <p className="rtl" style={{ fontSize: '13px', marginTop: '4px', color: 'var(--gold-hover)' }}>
            برنامج الشيخ زايد للإسكان · Sheikh Zayed Housing Programme
          </p>
        </div>

        {/* Entry cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '48px', width: '100%', maxWidth: '860px' }}>

          {/* Beneficiary card */}
          <Link
            to="/citizen"
            className="moei-card moei-card-top-gold fade-up"
            style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.15s, box-shadow 0.15s', animationDelay: '150ms' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', background: 'var(--gold-light)' }}>
              <User size={24} color="var(--gold)" />
            </div>
            <h2 className="rtl" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>المستفيد</h2>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Beneficiary</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              Check your rescheduling request status via UAE PASS.
            </p>
            <span className="moei-btn moei-btn-primary" style={{ width: '100%' }}>
              دخول · Enter Portal
            </span>
          </Link>

          {/* Officer card */}
          <Link
            to="/officer"
            className="moei-card moei-card-top-green fade-up"
            style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.15s, box-shadow 0.15s', animationDelay: '250ms' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', background: 'var(--green-light)' }}>
              <Shield size={24} color="var(--green)" />
            </div>
            <h2 className="rtl" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>الموظف</h2>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Officer</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              AI Agent dashboard — oversee autonomous decisions in real time.
            </p>
            <span className="moei-btn moei-btn-secondary" style={{ width: '100%' }}>
              لوحة التحكم · Dashboard
            </span>
          </Link>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
        10 applications processed · avg 2.7s · 98% compliance
      </footer>
    </div>
  );
}
