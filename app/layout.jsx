import './globals.css';

export const metadata = {
  title: '라운지',
  description: '사장님들의 솔직한 이야기 공간',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
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
          {children}
        </div>
      </body>
    </html>
  );
}
