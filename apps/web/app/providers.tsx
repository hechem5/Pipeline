'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'

function AuthSync() {
  const { data: session } = useSession()
  useEffect(() => {
    const syncAuth = () => {
      if (session && (session as any).apiToken) {
        window.postMessage({ type: 'PIPELINE_AUTH_SUCCESS', token: (session as any).apiToken }, window.location.origin)
      } else if (session === null) {
        window.postMessage({ type: 'PIPELINE_AUTH_SUCCESS', token: null }, window.location.origin)
      }
    }

    syncAuth()
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'PIPELINE_AUTH_REQUEST') syncAuth()
    })
  }, [session])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
    })
  )

  return (
    <SessionProvider>
      <AuthSync />
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          theme="dark"
          richColors
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#13161C',
              border: '1px solid #252A36',
              color: '#F1F5F9',
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  )
}
