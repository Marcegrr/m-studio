import { useEffect, useState } from 'react';

export function usePublicImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Siempre usar la ruta local en producción
        const res = await fetch('/public-images.json');
        if (!res.ok) {
          if (active) setImages([]);
        } else {
          const data = await res.json();
          const excluded = ['Logo.png', 'Mapa.png', 'vite.svg', 'IMG1.webp', 'IMG2.webp', 'IMG3.webp', 'IMG4.webp', 'baner barberia.webp'];
          const filtered = (data || []).filter(x => !excluded.includes(x.name));
          const mapped = filtered.map(x => {
            const path = x.relPath || x.path;
            const url = x.url;
            return { path, url };
          });
          if (active) setImages(mapped);
        }
      } catch (e) {
        console.error('Error loading gallery images:', e);
        if (active) setImages([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { images, loading };
}
