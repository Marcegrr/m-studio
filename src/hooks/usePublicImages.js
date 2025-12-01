import { useEffect, useState } from 'react';

export function usePublicImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || (import.meta.env.VITE_BACKEND_URL ? new URL(import.meta.env.VITE_BACKEND_URL).origin : '');
        const indexUrl = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/public-images.json` : '/public-images.json';
        const res = await fetch(indexUrl);
        if (!res.ok) {
          if (active) setImages([]);
        } else {
          const data = await res.json();
          const excluded = ['Logo.png', 'Mapa.png', 'vite.svg', 'IMG1.webp', 'IMG2.webp', 'IMG3.webp', 'IMG4.webp'];
          const filtered = (data || []).filter(x => !excluded.includes(x.name));
          const mapped = filtered.map(x => {
            const path = x.relPath || x.path;
            const url = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${x.url}` : x.url;
            return { path, url };
          });
          if (active) setImages(mapped);
        }
      } catch (e) {
        if (active) setImages([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { images, loading };
}
