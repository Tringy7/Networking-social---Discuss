import { translateApiFieldErrors } from './errorTranslation';

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!error || typeof error !== 'object' || !('errors' in error)) {
    return {};
  }

  const fieldErrors = error.errors;
  if (!fieldErrors || typeof fieldErrors !== 'object' || Array.isArray(fieldErrors)) {
    return {};
  }

  return translateApiFieldErrors(Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  )) as Record<string, string>;
}
