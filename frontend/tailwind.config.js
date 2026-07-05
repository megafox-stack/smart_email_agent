export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'dashboard-gradient': 'radial-gradient(circle at top, rgba(59, 130, 246, 0.12), transparent 40%)',
      },
    },
  },
  plugins: [],
}
