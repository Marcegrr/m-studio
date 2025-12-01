import { useEffect, useState } from 'react';

export function usePublicImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/public-images.json');
        if (!res.ok) {
          if (active) setImages([]);
        } else {
          const data = await res.json();
          const excluded = ['Logo.png', 'Mapa.png', 'vite.svg'];
          const filtered = (data || []).filter(x => !excluded.includes(x.name));
          const mapped = filtered.map(x => ({ path: x.relPath || x.path, url: x.url }));
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
