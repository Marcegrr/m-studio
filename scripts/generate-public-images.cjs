const fs = require('fs').promises;
const path = require('path');

async function walk(dir, base) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const res = path.resolve(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(res, base));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (['.png','.jpg','.jpeg','.webp','.gif','.svg','.avif','.ico'].includes(ext)) {
        const rel = path.relative(base, res).split(path.sep).join('/');
        files.push({ name: e.name, relPath: rel, url: '/' + rel });
      }
    }
  }
  return files;
}

async function main(){
  try{
    const base = path.resolve(__dirname, '..', 'public');
    const files = await walk(base, base);
    const outPath = path.join(base, 'public-images.json');
    await fs.writeFile(outPath, JSON.stringify(files, null, 2), 'utf8');
    console.log('Wrote', outPath, 'with', files.length, 'image(s)');
  }catch(err){
    console.error('Failed to generate public-images.json', err);
    process.exit(1);
  }
}

main();
