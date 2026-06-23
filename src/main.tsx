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

if (!redirectLoopbackToLocalhost()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}
