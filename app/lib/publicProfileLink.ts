import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

type Who = { customerId?: string | null; id?: string | null; profileReviewStatus?: string | null } | null | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The photographer's public profile URL, or '' when there is none.
 *
 * Only an approved profile has a public slug (SeoLookupController.slugFor answers 404 otherwise, on purpose: an
 * unapproved photographer has no public surface). Asking anyway made every unapproved photographer's Home log a failed
 * request in the browser console, so the lookup is skipped when there is nothing to find or the id is not a UUID
 * (which the backend would reject with a 400).
 */
export async function fetchPublicProfileUrl(user: Who): Promise<string> {
  const id = user?.customerId || user?.id || '';
  if (!UUID.test(id) || String(user?.profileReviewStatus || '').toUpperCase() !== 'ACCEPTED') return '';
  const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/public/seo/slug-for?type=photographer&id=${encodeURIComponent(id)}`);
  const body = res.ok ? await res.json().catch(() => null) : null;
  return body?.slug ? `https://connekyt.com/photographers/${body.slug}` : '';
}
