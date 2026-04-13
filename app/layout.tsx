import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';

const AuthProvider = dynamic(
  () =>
    import('@/hooks/useAuth').then((mod) => ({ default: mod.AuthProvider })),
  { ssr: false },
);

export const metadata: Metadata = {
  title: 'CRM Pharmacie Fatima - Gestion intelligente',
  description:
    'CRM intelligent pour pharmacies indépendantes avec segmentation IA et relances WhatsApp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-pharma-gray antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
