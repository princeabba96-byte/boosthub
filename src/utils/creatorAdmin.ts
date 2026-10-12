export const CREATOR_EMAILS = [
  'pchukwuka114@gmail.com',
  'princeabba96@gmail.com',
];

export const CREATOR_USERNAMES = [
  'princeabba96-byte',
  'princeabba',
  'prince_abba',
  'admin_abba',
  'prince',
];

export const CREATOR_USER_IDS = [
  'eaada352-5704-4566-a7a7-88df80853ada',
  'admin-abba-uuid',
  'prince_abba_admin_uuid',
  '00000000-0000-4000-8000-000000000001',
];

export const MASTER_CREATOR_PIN = '9696';

export function isPlatformFounder(profile?: any): boolean {
  if (!profile) return false;
  if (typeof profile === 'string') {
    const s = profile.trim().toLowerCase();
    return (
      CREATOR_EMAILS.includes(s) ||
      CREATOR_USERNAMES.includes(s) ||
      CREATOR_USER_IDS.includes(s)
    );
  }

  const email = String(profile.email || '').trim().toLowerCase();
  const username = String(profile.username || '').trim().toLowerCase();
  const id = String(profile.id || profile.uid || '').trim().toLowerCase();

  if (CREATOR_EMAILS.includes(email)) return true;
  if (CREATOR_USERNAMES.includes(username)) return true;
  if (CREATOR_USER_IDS.includes(id)) return true;

  if (Boolean(profile.isAdmin) || profile.role === 'admin' || profile.isCreator) {
    return true;
  }

  // Check if session has validated master PIN
  if (typeof window !== 'undefined') {
    try {
      if (sessionStorage.getItem('boosthub_overseer_master_unlocked') === 'true') {
        return true;
      }
    } catch {}
  }

  return false;
}
