import { CountryEntity } from '../types';

export function getCountryFlag(code?: string): string {
  const c = (code || '').toLowerCase();
  if (c.includes('uk') || c.includes('britain') || c.includes('united-kingdom')) return '🇬🇧';
  if (c.includes('australia') || c.includes('au')) return '🇦🇺';
  if (c.includes('nz') || c.includes('zealand')) return '🇳🇿';
  if (c.includes('usa') || c.includes('us') || c.includes('united-states') || c.includes('america')) return '🇺🇸';
  if (c.includes('canada') || c.includes('ca')) return '🇨🇦';
  if (c.includes('germany') || c.includes('de')) return '🇩🇪';
  if (c.includes('ireland') || c.includes('ie')) return '🇮🇪';
  if (c.includes('malaysia') || c.includes('my')) return '🇲🇾';
  if (c.includes('france') || c.includes('fr')) return '🇫🇷';
  return '🌍';
}

export function getCountryFallbackImage(code?: string): string {
  const c = (code || '').toLowerCase();
  if (c.includes('uk') || c.includes('britain')) return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80';
  if (c.includes('australia') || c.includes('au')) return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80';
  if (c.includes('nz') || c.includes('zealand')) return 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&auto=format&fit=crop&q=80';
  if (c.includes('usa') || c.includes('us')) return 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&auto=format&fit=crop&q=80';
  if (c.includes('canada') || c.includes('ca')) return 'https://images.unsplash.com/photo-1517935703635-27c946452995?w=800&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80';
}
