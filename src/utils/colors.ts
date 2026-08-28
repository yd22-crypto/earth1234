// Palette of vibrant, distinct, and eye-pleasing colors for roulette slices
export const PALETTE: string[] = [
  '#EF4444', // Red / Coral
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#A855F7', // Violet
  '#0EA5E9', // Sky
  '#E11D48', // Rose
  '#10B981', // Mint
  '#D97706', // Gold
];

/**
 * Returns a color from the palette by index
 */
export function getPaletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

/**
 * Determine if text should be light or dark based on background hex
 */
export function getContrastTextColor(hexColor: string): string {
  // Convert hex to rgb
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // YIQ luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 165 ? '#1E293B' : '#FFFFFF';
}
