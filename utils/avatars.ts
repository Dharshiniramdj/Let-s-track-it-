export interface AvatarPreset {
  id: string;
  name: string;
  src: string;
  role: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: 'pro-man',
    name: 'Alex Vance',
    role: 'Finance Manager',
    src: '/src/assets/images/profile_man_pro_1791302122857.jpg'
  },
  {
    id: 'pro-woman',
    name: 'Elena Rostova',
    role: 'Investment Analyst',
    src: '/src/assets/images/profile_woman_pro_1791302135189.jpg'
  },
  {
    id: 'creator-tech',
    name: 'Kaelen Mori',
    role: 'Tech Entrepreneur',
    src: '/src/assets/images/profile_creator_tech_1791302147645.jpg'
  },
  {
    id: 'exec-gold',
    name: 'Marcus Sterling',
    role: 'Managing Partner',
    src: '/src/assets/images/profile_executive_gold_1791302159011.jpg'
  },
  {
    id: 'minimal-modern',
    name: 'Sophia Chen',
    role: 'Product Strategist',
    src: '/src/assets/images/profile_minimal_avatar_1791302172919.jpg'
  }
];

export const DEFAULT_AVATAR = PRESET_AVATARS[0].src;

/**
 * Returns a high-resolution avatar URL.
 * Handles custom data URLs, local file paths, preset IDs, and deterministically
 * migrates legacy DiceBear seeds to our bespoke studio portraits.
 */
export const resolveAvatarUrl = (seedOrUrl?: string): string => {
  if (!seedOrUrl) return DEFAULT_AVATAR;

  // Direct path or data URL
  if (seedOrUrl.startsWith('data:') || seedOrUrl.startsWith('/src/assets/') || seedOrUrl.startsWith('/')) {
    return seedOrUrl;
  }

  // Matches preset id
  const matchingPreset = PRESET_AVATARS.find(
    p => p.id === seedOrUrl || p.name.toLowerCase() === seedOrUrl.toLowerCase()
  );
  if (matchingPreset) return matchingPreset.src;

  // Deterministic mapping for legacy DiceBear seeds
  const hash = seedOrUrl.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const index = Math.abs(hash) % PRESET_AVATARS.length;
  return PRESET_AVATARS[index].src;
};
