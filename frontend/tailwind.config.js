module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}', // ← 여기가 너처럼 src에 Chat.jsx가 있는 경우 필요
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
