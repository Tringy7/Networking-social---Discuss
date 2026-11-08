export type SearchType = 'posts' | 'communities' | 'people';

export function parseSearchQuery(input: string): { type: SearchType; keyword: string } {
  const query = input.trim();
  const prefix = query.slice(0, 2).toLowerCase();
  if (prefix === 'u/') return { type: 'people', keyword: query.slice(2).trim() };
  if (prefix === 'c/') return { type: 'communities', keyword: query.slice(2).trim() };
  return { type: 'posts', keyword: query };
}

export function formatSearchQuery(type: SearchType, keyword: string): string {
  return `${type === 'people' ? 'u/' : type === 'communities' ? 'c/' : ''}${keyword}`;
}
