/**
 * Avatar Type Definitions
 * Matches the "Human Style" avatar system - Duolingo Style
 */

export type HairType = 'none' | 'short' | 'medium' | 'long' | 'curly' | 'afro' | 'bun' | 'ponytail';
export type EyeType = 'normal' | 'happy' | 'wink' | 'surprised' | 'sleepy';
export type MouthType = 'smile' | 'grin' | 'neutral' | 'open' | 'smirk';
export type ShirtType = 'tshirt' | 'hoodie' | 'sweater' | 'tank';
export type GlassesType = 'none' | 'round' | 'square' | 'aviator' | 'cat-eye';
export type AccessoryType = 'none' | 'earrings' | 'necklace' | 'headband' | 'bow';
export type HatType = 'none' | 'cap' | 'beanie' | 'fedora' | 'crown';
export type FacialHairType = 'none' | 'stubble' | 'mustache' | 'beard' | 'goatee';

export interface AvatarConfig {
  skinColor: string;
  hairType: HairType;
  hairColor: string;
  eyeType: EyeType;
  eyeColor: string;
  mouthType: MouthType;
  shirtType: ShirtType;
  shirtColor: string;
  bgColor: string;
  // New Duolingo-style accessories
  glassesType?: GlassesType;
  glasses?: GlassesType; // Alias used by shapes/Glasses.tsx
  glassesColor?: string;
  accessoryType?: AccessoryType;
  earrings?: AccessoryType; // Alias used by shapes/Earrings.tsx
  hatType?: HatType;
  hatColor?: string;
  facialHairType?: FacialHairType;
  facialHairColor?: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinColor: '#F5D0C5',
  hairType: 'short',
  hairColor: '#4A3728',
  eyeType: 'normal',
  eyeColor: '#4A3728',
  mouthType: 'smile',
  shirtType: 'tshirt',
  shirtColor: '#3498DB',
  bgColor: '#1A1A2E',
  glassesType: 'none',
  glassesColor: '#1A1A1A',
  accessoryType: 'none',
  hatType: 'none',
  hatColor: '#1A1A1A',
  facialHairType: 'none',
  facialHairColor: '#4A3728',
};

// Color palettes
export const SKIN_COLORS = [
  '#FDEBD0',
  '#F5D0C5',
  '#E5B299',
  '#D4A574',
  '#C49A6C',
  '#A67B5B',
  '#8B6914',
  '#704214',
  '#5C4033',
];

export const HAIR_COLORS = [
  '#1A1A1A',
  '#4A3728',
  '#8B4513',
  '#D2691E',
  '#FFD700',
  '#DC143C',
  '#FF69B4',
  '#4B0082',
];

export const EYE_COLORS = ['#4A3728', '#1A1A1A', '#2E8B57', '#4169E1', '#808080'];

export const SHIRT_COLORS = [
  '#3498DB',
  '#2ECC71',
  '#E74C3C',
  '#9B59B6',
  '#F39C12',
  '#1ABC9C',
  '#34495E',
  '#E91E63',
];

export const BG_COLORS = [
  '#1A1A2E',
  '#16213E',
  '#2C3E50',
  '#1ABC9C',
  '#9B59B6',
  '#E74C3C',
  '#F39C12',
  '#2ECC71',
];

export const GLASSES_COLORS = ['#1A1A1A', '#4A3728', '#3498DB', '#E74C3C', '#F1C40F', '#9B59B6'];

export const HAT_COLORS = [
  '#1A1A1A',
  '#E74C3C',
  '#3498DB',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
  '#34495E',
];
