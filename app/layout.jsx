import '../styles/globals.css';

export const metadata = {
  title: '라운지',
  description: '사장님들의 솔직한 이야기 공간',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 폰트 CDN — 전체 앱에서 사용 */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var ua = navigator.userAgent || '';
                if (ua.indexOf('KAKAOTALK') > -1) {
                  var url = location.href;
                  if (/iPhone|iPad|iPod/i.test(ua)) {
                    location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
                  } else if (/Android/i.test(ua)) {
                    location.href = 'intent://' + url.replace(/https?:\\/\\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
                  }
                }
              })();
            `,
          }}
        />
        <div className="app-container">
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
