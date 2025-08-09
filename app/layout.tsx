import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../src/index.css';
import '../src/App.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IIIF 3D Progressive Loading Demo',
  description: 'Progressive loading and geographic mapping for 3D models using IIIF standards',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}