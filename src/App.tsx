import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarConfigProvider } from '@/contexts/sidebar-context'
import { AuthProvider } from '@/contexts/auth-context'
import { AppRouter } from '@/components/router/app-router'
import '@/i18n' // Initialize i18n

// Get basename from environment (for deployment) or use empty string for development
const basename = import.meta.env.VITE_BASENAME || ''

function App() {
  return (
    <div className="font-sans antialiased" style={{ fontFamily: 'var(--font-inter)' }}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <SidebarConfigProvider>
            <Router basename={basename}>
              <AppRouter />
            </Router>
          </SidebarConfigProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </div>
  )
}

export default App
