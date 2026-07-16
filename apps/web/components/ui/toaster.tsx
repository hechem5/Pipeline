'use client'
import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      richColors
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#13161C',
          border: '1px solid #252A36',
          color: '#F1F5F9',
          fontFamily: 'DM Sans, sans-serif',
        },
      }}
    />
  )
}
