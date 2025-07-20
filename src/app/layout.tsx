import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import GenkitProvider from './genkit-provider';

export const metadata: Metadata = {
  title: 'RetroSnap',
  description: 'Capture your moments with a 90s vibe!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <GenkitProvider>
          {children}
          <Toaster />
        </GenkitProvider>
      </body>
    </html>
  );
}
