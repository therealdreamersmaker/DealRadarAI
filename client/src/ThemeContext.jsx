import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext({ isDark: true, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('dr-theme') !== 'light' }
    catch { return true }
  })

  const toggle = () => setIsDark(d => {
    const next = !d
    try { localStorage.setItem('dr-theme', next ? 'dark' : 'light') } catch {}
    return next
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Computed values for chart tooltips and JS-driven styles
  const chart = isDark
    ? { bg: '#0f172a', border: '#1e3a5f', grid: '#1e293b', tick: '#64748b' }
    : { bg: '#ffffff', border: '#bfdbfe', grid: '#e2e8f0', tick: '#6b7280' }

  return (
    <Ctx.Provider value={{ isDark, toggle, chart }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTheme = () => useContext(Ctx)
