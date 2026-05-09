// ================================================================
// GCFI — Intégration Cloudinary (Upload unsigned)
// Cloud name  : dwmrzp61c
// Upload preset : gcfi_upload (Unsigned)
// ================================================================

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   ?? 'dwmrzp61c';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? 'gcfi_upload';
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

// Upload d'un fichier vers Cloudinary (unsigned)
export async function uploadToCloudinary(
  file: File,
  folder = 'gcfi',
  onProgress?: (pct: number) => void
): Promise<CloudinaryResult> {
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

// Génère une URL optimisée avec transformations Cloudinary
export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number; format?: string } = {}
): string {
  const { width = 800, height, quality = 'auto', format = 'auto' } = options;
  const transforms = [
    `q_${quality}`,
    `f_${format}`,
    `w_${width}`,
    height ? `h_${height}` : '',
    'c_fill',
  ].filter(Boolean).join(',');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}
