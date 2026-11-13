import './globals.css';

export const metadata = {
  title: 'British Pathé — Chronological Newsreel Archive (1896–1980)',
  description: 'Interactive chronological timeline of historical British Pathé newsreels.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-amber-500 selection:text-stone-950">
        {children}
      </body>
    </html>
  );
}
