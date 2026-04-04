/**
 * Centralized branding configuration.
 * All bank-specific branding is driven by environment variables,
 * making this a white-label product deployable for any bank.
 */
export const branding = {
  bankName: import.meta.env.VITE_BANK_NAME || 'Bank',
  appTitle: import.meta.env.VITE_APP_TITLE || 'Data Quality Monitor',
  logoUrl: import.meta.env.VITE_LOGO_URL || '/logo.svg',
};
