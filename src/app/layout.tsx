import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'NAGRIK — See. Speak. Act. | Civic Issue Intelligence',
  description:
    'Independent civic issue intelligence and institutional accountability platform. Transforming fragmented complaints into explainable systemic patterns, evidence-backed investigations, and measurable outcomes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 4.5rem - 300px)' }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
