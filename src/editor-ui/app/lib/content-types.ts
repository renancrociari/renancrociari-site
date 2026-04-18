export function parsePublished(
  value: string | boolean | undefined
): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

export type CaseStudyMetadata = {
  title: string;
  slug?: string;
  summary: string;
  publishedAt: string;
  published?: boolean;
  order?: number;
  company?: string;
  role?: string;
  team?: string;
  duration?: string;
  domain?: string;
  platforms?: string;
  tools?: string;
  goals?: string;
  outcomes?: string;
  impactMetrics?: string;
  tags?: string;
  status?: string;
  coverImage?: string;
  gallery?: string;
  video?: string;
};
