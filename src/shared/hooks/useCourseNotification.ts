import { useEffect } from 'react';
import { sendCourseEnrollmentEmail } from '@/shared/lib/email-service';

interface CourseEnrolledDetail {
  studentEmail: string;
  courseName: string;
  studentName: string;
  startDate: string;
  instructor: string;
}

export function useCourseNotification() {
  useEffect(() => {
    const handler = async (event: Event) => {
      const { courseData } = (event as CustomEvent<{ courseData: CourseEnrolledDetail }>).detail;
      if (courseData.studentEmail) {
        await sendCourseEnrollmentEmail(courseData.studentEmail, courseData);
      }
    };

    window.addEventListener('gcfi:course-enrolled', handler);
    return () => window.removeEventListener('gcfi:course-enrolled', handler);
  }, []);
}