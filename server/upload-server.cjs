const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Permitir localhost para desarrollo y tu dominio de producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL // Se configurará en Render
].filter(Boolean);

app.use(cors({ 
  origin: function(origin, callback) {
    // Permitir requests sin origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('netlify.app') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false 
}));

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const name = `${Date.now()}_${safeName}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const relPath = path.posix.join('uploads', req.file.filename);
  const url = `/${relPath}`;
  try {
    // Regenerate public-images.json after saving
    const publicDir = path.join(__dirname, '..', 'public');
    const outPath = path.join(publicDir, 'public-images.json');
    const files = [];
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) {
          walk(abs);
        } else if (e.isFile()) {
          const ext = path.extname(e.name).toLowerCase();
          if (['.png','.jpg','.jpeg','.webp','.gif','.svg','.avif','.ico'].includes(ext)) {
            const rel = path.relative(publicDir, abs).split(path.sep).join('/');
            files.push({ name: e.name, relPath: rel, url: '/' + rel });
          }
        }
      }
    };
    walk(publicDir);
    fs.writeFileSync(outPath, JSON.stringify(files, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to regenerate public-images.json:', e.message);
  }
  res.json({ ok: true, path: relPath, url });
});

app.delete('/upload/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      // Regenerate public-images.json after deletion
      const publicDir = path.join(__dirname, '..', 'public');
      const outPath = path.join(publicDir, 'public-images.json');
      const files = [];
      const walk = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const abs = path.join(dir, e.name);
          if (e.isDirectory()) {
            walk(abs);
          } else if (e.isFile()) {
            const ext = path.extname(e.name).toLowerCase();
            if (['.png','.jpg','.jpeg','.webp','.gif','.svg','.avif','.ico'].includes(ext)) {
              const rel = path.relative(publicDir, abs).split(path.sep).join('/');
              files.push({ name: e.name, relPath: rel, url: '/' + rel });
            }
          }
        }
      };
      walk(publicDir);
      fs.writeFileSync(outPath, JSON.stringify(files, null, 2), 'utf8');
      res.json({ ok: true, deleted: filename });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (e) {
    console.error('Delete error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Upload server listening on http://localhost:${PORT}`);
});