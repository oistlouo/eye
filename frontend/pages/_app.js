import '../styles/globals.css'; // tailwind가 적용된 스타일 파일

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
