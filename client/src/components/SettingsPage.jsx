export default function SettingsPage({ t }) {
  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dr-text-1)', marginBottom: 8 }}>{t('Settings', 'Configuración')}</h1>
      <p style={{ color: 'var(--dr-text-faint)', fontSize: 14, marginBottom: 32 }}>{t('Manage your DealRadar AI preferences and integrations.', 'Administra tus preferencias e integraciones de DealRadar AI.')}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { icon: '🔑', title: t('API Keys', 'Claves de API'), desc: t('RentCast, Gemini, and other integrations', 'RentCast, Gemini y otras integraciones') },
          { icon: '🌐', title: t('Language', 'Idioma'), desc: t('Switch between English and Spanish in the sidebar', 'Cambia entre inglés y español en la barra lateral') },
          { icon: '🎨', title: t('Appearance', 'Apariencia'), desc: t('Dark/light mode toggle in the sidebar', 'Alternar modo oscuro/claro en la barra lateral') },
          { icon: '🔔', title: t('Notifications', 'Notificaciones'), desc: t('Email alerts when Autopilot finds new leads', 'Alertas por email cuando el Autopiloto encuentra nuevos leads') + ' — ' + t('Coming soon', 'Próximamente') },
          { icon: '📤', title: t('Exports', 'Exportaciones'), desc: t('Default CSV format and column settings', 'Formato CSV predeterminado y configuración de columnas') + ' — ' + t('Coming soon', 'Próximamente') },
        ].map(item => (
          <div key={item.title} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'var(--dr-surface)', border: '1px solid var(--dr-border)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 24, width: 40, textAlign: 'center' }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--dr-text-1)', fontSize: 14, marginBottom: 2 }}>{item.title}</div>
              <div style={{ color: 'var(--dr-text-faint)', fontSize: 12 }}>{item.desc}</div>
            </div>
            <div style={{ color: 'var(--dr-text-faintest)', fontSize: 18 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}
