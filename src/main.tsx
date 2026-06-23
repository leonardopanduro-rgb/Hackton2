import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'

function redirectLoopbackToLocalhost(): boolean {
  const { protocol, hostname, port, pathname, search, hash } = window.location
  if (hostname !== '127.0.0.1') {
    return false
  }

  const nextPort = port ? `:${port}` : ''
  window.location.replace(`${protocol}//localhost${nextPort}${pathname}${search}${hash}`)
  return true
}

async function prepare() {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser.ts')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

if (!redirectLoopbackToLocalhost()) {
  prepare().then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StrictMode>,
    )
  })
}
