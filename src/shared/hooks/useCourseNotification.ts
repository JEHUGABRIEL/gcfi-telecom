import { useEffect } from 'react';
import { sendCourseEnrollmentEmail } from '@/shared/lib/email-service';

interface CourseData {
  studentEmail: string;
  courseName: string;
  studentName: string;
  startDate: string;
  instructor: string;
}

export function useCourseNotification() {
  useEffect(() => {
    const handler = async (event: Event) => {
      const { courseData } = (event as CustomEvent<{ courseData: CourseData }>).detail;
      if (!courseData?.studentEmail) return;

      try {
        await sendCourseEnrollmentEmail(courseData.studentEmail, courseData);
      } catch {
        console.error('[CourseNotification] Erreur lors de l\'envoi de l\'email');
      }
    };

    window.addEventListener('gcfi:course-enrolled', handler);
    return () => window.removeEventListener('gcfi:course-enrolled', handler);
  }, []);
}
