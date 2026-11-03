export type LessonCategory = 'Basics' | 'Causes' | 'Effects';

export type Lesson = {
  id: string;
  number: number;
  title: string;
  minutes: number;
  category: LessonCategory;
  summary: string;
  content: string[];
};