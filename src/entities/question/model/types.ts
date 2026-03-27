export interface QuestionMeta {
  title: string;
  order: number;
  slug: string;
  category: string;
}

export interface QuestionFull {
  meta: QuestionMeta;
  content: string;
}

export interface AdjacentQuestions {
  prev: QuestionMeta | null;
  next: QuestionMeta | null;
}
