export interface ChallengeCategoryMeta {
  title: string;
  order: number;
  slug: string;
  description: string;
  icon?: string;
}

export interface ChallengeMeta {
  title: string;
  order: number;
  slug: string;
  category: string;
}

export interface ChallengeFull {
  meta: ChallengeMeta;
  content: string;
}

export interface AdjacentChallenges {
  prev: ChallengeMeta | null;
  next: ChallengeMeta | null;
}
