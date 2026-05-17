// ================================================================
// GCFI — Intégration Cloudinary
// Cloud name et preset UNIQUEMENT depuis les variables d'env
// Ne jamais mettre de valeurs en dur ici
// ================================================================

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.warn('[Cloudinary] Variables VITE_CLOUDINARY_CLOUD_NAME et VITE_CLOUDINARY_UPLOAD_PRESET manquantes.');
}

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// ✅ Types MIME autorisés — bloque tout fichier non-image
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// ✅ Taille max : 5 Mo
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadToCloudinary(
  file: File,
  folder = 'gcfi',
  onProgress?: (pct: number) => void
): Promise<CloudinaryResult> {
  // ✅ Validation type MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Type de fichier non autorisé : ${file.type}. Utilisez JPEG, PNG, WebP ou GIF.`);
  }
  // ✅ Validation taille
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 5 Mo.`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(`Cloudinary error ${xhr.status}: ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error('Erreur réseau Cloudinary'));
    xhr.send(formData);
  });
}

export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number; format?: string } = {}
): string {
  const { width = 800, height, quality = 'auto', format = 'auto' } = options;
  const transforms = [
    `q_${quality}`, `f_${format}`, `w_${width}`,
    height ? `h_${height}` : '', 'c_fill',
  ].filter(Boolean).join(',');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}


