export const STORAGE_KEY = 'site-schedule-visited-v1';
export const KEY_TRACKING_STORAGE_KEY = 'wttg3-key-tracking-v1';
export const KEY_ROW_COUNT = 8;
export const EMPTY_KEY_ROWS = Array.from({ length: KEY_ROW_COUNT }, () => ({ key: '', wiki: '' }));
export const APP_TABS = ['sites', 'tiers', 'keys', 'tracker'];

export function getTabFromLocation() {
  const tab = window.location.hash.slice(1);
  return APP_TABS.includes(tab) ? tab : 'sites';
}
