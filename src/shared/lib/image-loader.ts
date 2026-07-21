export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const q = quality ?? 75;

  // Cloudinary — transformation native
  if (src.includes('res.cloudinary.com')) {
    return src.replace('/upload/', `/upload/w_${width},q_${q},f_auto/`);
  }

  // Unsplash — utilise ses propres paramètres de resize
  if (src.includes('images.unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', String(q));
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    return url.toString();
  }

  // Tout le reste (Wikimedia, pravatar, Supabase...) — as-is avec width pour satisfaire Next.js
  return `${src}${src.includes('?') ? '&' : '?'}_w=${width}`;
}