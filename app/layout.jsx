import '../styles/globals.css';

export const metadata = {
  title: 'Lounge',
  description: 'Community for business owners',
};

export default function RootLayout({ children }) {
  return (
    <html lang='ko'>
      <body>{children}</body>
    </html>
  );
}
