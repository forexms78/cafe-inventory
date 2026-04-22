import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '디저트39 재고관리',
    short_name: '재고관리',
    description: '디저트39 신사역점 재고관리 앱',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf2f8',
    theme_color: '#ec4899',
    icons: [
      { src: '/icon.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
