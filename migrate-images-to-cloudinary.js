import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env depuis la racine
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Utiliser les mêmes variables que dans l'application
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes dans .env');
  process.exit(1);
}

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ CLOUDINARY_API_KEY ou CLOUDINARY_API_SECRET manquantes dans .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const SUPABASE_BEARER = `Bearer ${SUPABASE_ANON_KEY}`;

async function fetchTrainings() {
  const url = `${SUPABASE_URL}/rest/v1/trainings?select=id,title,image`;
  console.log(`📡 Appel API : ${url}`);
  const response = await axios.get(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: SUPABASE_BEARER },
  });
  return response.data;
}

async function updateTrainingImage(id, newImageUrl) {
  await axios.patch(
    `${SUPABASE_URL}/rest/v1/trainings?id=eq.${id}`,
    { image: newImageUrl },
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: SUPABASE_BEARER, 'Content-Type': 'application/json' } }
  );
}

async function migrateImage(url, title) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'gcfi/trainings', public_id: `training_${Date.now()}_${title.replace(/\s/g, '_')}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
    return result.secure_url;
  } catch (err) {
    console.error(`❌ Erreur migration pour ${title}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Récupération des formations...');
  const trainings = await fetchTrainings();
  console.log(`📚 ${trainings.length} formation(s) trouvée(s).`);

  for (const training of trainings) {
    const currentImage = training.image;
    if (!currentImage || currentImage.includes('cloudinary.com')) {
      console.log(`⏩ Ignoré : ${training.title} (déjà Cloudinary ou pas d'image)`);
      continue;
    }
    console.log(`📤 Téléchargement de : ${currentImage}`);
    const newUrl = await migrateImage(currentImage, training.title);
    if (newUrl) {
      console.log(`✅ Migré : ${training.title} -> ${newUrl}`);
      await updateTrainingImage(training.id, newUrl);
    } else {
      console.log(`❌ Échec pour ${training.title}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log('🎉 Migration terminée !');
}

main().catch(console.error);