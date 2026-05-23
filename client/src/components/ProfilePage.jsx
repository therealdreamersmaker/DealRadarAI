export default function ProfilePage({ t }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dr-text-1)', marginBottom: 8 }}>{t('Profile', 'Perfil')}</h1>
      <p style={{ color: 'var(--dr-text-faint)', fontSize: 14, marginBottom: 32 }}>{t('Your account information and subscription details.', 'Tu información de cuenta y detalles de suscripción.')}</p>

      <div style={{ background: 'var(--dr-surface)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: '28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--dr-text-1)', fontSize: 18 }}>DealRadar User</div>
            <div style={{ color: 'var(--dr-text-faint)', fontSize: 13, marginTop: 2 }}>perrinopictures@gmail.com</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            [t('Plan', 'Plan'), 'MVP / Pro'],
            [t('Markets', 'Mercados'), t('Unlimited', 'Ilimitados')],
            [t('Autopilot Runs', 'Ejecuciones Autopiloto'), t('Unlimited', 'Ilimitados')],
            [t('AI Queries', 'Consultas IA'), t('50 / month (RentCast)', '50 / mes (RentCast)')],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--dr-surface-deep)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--dr-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dr-text-1)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '14px 18px', fontSize: 12, color: '#60a5fa' }}>
        💡 {t('User authentication and subscription management coming soon.', 'Autenticación de usuarios y gestión de suscripciones próximamente.')}
      </div>
    </div>
  )
}
