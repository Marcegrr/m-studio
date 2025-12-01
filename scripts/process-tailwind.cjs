const fs = require('fs')
const path = require('path')
const postcss = require('postcss')

const projectRoot = path.resolve(__dirname, '..')
const cssIn = path.join(projectRoot, 'src', 'index.css')
const cssOut = path.join(projectRoot, 'temp-tailwind-output.css')

const postcssConfig = require(path.join(projectRoot, 'postcss.config.cjs'))

const css = fs.readFileSync(cssIn, 'utf8')

postcss(postcssConfig.plugins || [])
  .process(css, { from: cssIn, to: cssOut })
  .then(result => {
    fs.writeFileSync(cssOut, result.css, 'utf8')
    if (result.map) fs.writeFileSync(cssOut + '.map', result.map.toString(), 'utf8')
    console.log('Wrote', cssOut)
  })
  .catch(err => {
    console.error('Error processing CSS:', err)
    process.exit(1)
  })
