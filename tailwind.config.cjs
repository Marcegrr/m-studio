module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,html}',
  ],
  safelist: [
    // explicit classes used in App.jsx
    'bg-green-500', 'text-white', 'p-4', 'text-center', 'font-bold',
    'bg-black', 'min-h-screen', 'font-sans', 'text-6xl', 'text-3xl', 'text-4xl',
    'text-gray-300', 'bg-zinc-900', 'bg-zinc-950', 'border-zinc-900', 'border-red-600',
    'bg-red-600', 'hover:bg-red-700', 'px-5', 'py-2', 'rounded-lg', 'px-6', 'py-12',
    'max-w-3xl', 'mx-auto', 'grid', 'gap-6', 'bg-zinc-900', 'p-5', 'rounded-xl', 'border',
    'text-gray-400', 'bg-green-500',
    // common utility patterns
    { pattern: /^(bg|text|border|hover:bg|hover:text|p|px|py|m|mx|my|min-h|max-w|rounded|font|text|grid|gap)-/ }
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
