import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-mystic' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata = {
  title: 'Zaura — Your Cosmic Self, Revealed',
  description: 'A mystical self-discovery experience: 20 esoteric modalities computed from your birth moment — astrology, numerology, human design, tarot and beyond.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${inter.variable} font-sans antialiased`} style={{ background: '#070616', color: '#e8e6f5' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
