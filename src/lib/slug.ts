/**
 * Converts a name to a URL-friendly slug
 * Example: "Leo Nagano" -> "leo-nagano"
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a unique slug by appending a number if needed
 * Example: "leo-nagano" -> "leo-nagano-2" if "leo-nagano" already exists
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string, excludeUserId?: string) => Promise<boolean>,
  excludeUserId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug, excludeUserId)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

