import type { Metadata } from 'next';
import AchievementDetail from '@/modules/home/components/AchievementDetail';
import JsonLd from '@/shared/components/JsonLd';
import { getAchievementById } from '@/shared/lib/seo-records';
import { achievementSchema, breadcrumbSchema } from '@/shared/lib/structured-data';
import { buildPageMetadata, toDescription, NOT_FOUND_METADATA } from '@/shared/lib/seo-metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const achievement = await getAchievementById(id);
  if (!achievement) return NOT_FOUND_METADATA;

  return buildPageMetadata({
    title: `${achievement.title} (${achievement.year})`,
    description: toDescription(
      achievement.description,
      `Réalisation GCFI Telecom en ${achievement.year} : ${achievement.title}.`
    ),
    path: `/realisations/${achievement.id}`,
    image: achievement.image,
    keywords: [achievement.title, 'réalisation', 'GCFI Telecom', 'Bangui', 'RCA'],
  });
}

export default async function RealisationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const achievement = await getAchievementById(id);

  return (
    <>
      {achievement && (
        <JsonLd
          data={[
            achievementSchema(achievement),
            breadcrumbSchema([
              { name: 'Accueil', path: '/' },
              { name: 'Réalisations', path: '/#realisations' },
              { name: achievement.title, path: `/realisations/${achievement.id}` },
            ]),
          ]}
        />
      )}
      <AchievementDetail initialAchievement={achievement ?? undefined} />
    </>
  );
}
