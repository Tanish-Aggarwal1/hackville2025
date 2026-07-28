import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // TODO: change appId and appName once the product name is settled (PLAN.md §13.5).
  // Safe to change now — no android/ or ios/ project has been generated yet.
  appId: 'ca.hackville2025.roommatefinder',
  appName: 'Roommate Finder',
  webDir: 'dist'
};

export default config;
