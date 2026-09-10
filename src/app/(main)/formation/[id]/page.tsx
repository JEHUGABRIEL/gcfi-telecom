import type { Metadata } from 'next';
import CourseDetail from '@/modules/training/components/CourseDetail';
import JsonLd from '@/shared/components/JsonLd';
import { getCourseById } from '@/shared/lib/seo-records';
import { courseSchema, breadcrumbSchema } from '@/shared/lib/structured-data';
import { buildPageMetadata, toDescription, NOT_FOUND_METADATA } from '@/shared/lib/seo-metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) return NOT_FOUND_METADATA;

  return buildPageMetadata({
    title: `Formation ${course.title} — ${course.duration}`,
    description: toDescription(
      course.description,
      `Formation ${course.title} (${course.duration}) dispensée par GCFI Telecom à Bangui, République Centrafricaine.`
    ),
    path: `/formation/${course.id}`,
    image: course.image,
    keywords: [course.title, course.category, 'formation', 'Bangui', 'RCA', ...(course.tags ?? [])],
  });
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourseById(id);

  return (
    <>
      {course && (
        <JsonLd
          data={[
            courseSchema(course),
            breadcrumbSchema([
              { name: 'Accueil', path: '/' },
              { name: 'Formations', path: '/formation' },
              { name: course.title, path: `/formation/${course.id}` },
            ]),
          ]}
        />
      )}
      <CourseDetail initialCourse={course ?? undefined} />
    </>
  );
}
