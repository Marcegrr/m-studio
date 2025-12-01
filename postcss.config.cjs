module.exports = {
  plugins: [
    // pass explicit config path to ensure Tailwind picks up our config
    require('@tailwindcss/postcss')({ config: './tailwind.config.cjs' }),
    require('autoprefixer'),
  ],
};
