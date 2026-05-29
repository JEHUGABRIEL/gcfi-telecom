/**
 * Custom Next.js image loader.
 *
 * — Cloudinary URLs  → transformed with native Cloudinary CDN params
 *   (bypasses Next.js server-side proxy, served directly from Cloudinary edge)
 * — All other URLs   → returned as-is
 *   (Unsplash already has ?auto=format&w=N, Wikipedia/Supabase serve raw)
 */
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

  if (src.includes('res.cloudinary.com')) {
    // Insert transformation params right after /upload/
    // e.g. /upload/v123/path → /upload/w_640,q_75,f_auto/v123/path
    return src.replace('/upload/', `/upload/w_${width},q_${q},f_auto/`);
  }

  return src;
}
