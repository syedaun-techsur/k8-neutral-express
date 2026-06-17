// app/layout.js
import './globals.css';

export const metadata = {
  title: 'QuickNotes',
  description: 'A personal, single-user, mobile-first notes app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
