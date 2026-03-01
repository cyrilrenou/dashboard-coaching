import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Coaching — Cyril RENOU',
  description: 'Suivi coaching et performance réunions Duplix',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#0a0a0f' }}>{children}</body>
    </html>
  )
}
