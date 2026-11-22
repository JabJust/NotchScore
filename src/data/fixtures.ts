export type TeamSide = 'home' | 'away';

export type CutoutStyle = 'unified' | 'split';

export type GlowIntensity = 'subtle' | 'vibrant' | 'stadium';

export type PhoneScreenContext = 'lockscreen' | 'homescreen' | 'article';

export type WallpaperId = 'stadium' | 'obsidian';

export interface TeamInfo {
  code: string;
  name: string;
  color: string;
  scorers: string[];
}

export interface FixturePreset {
  id: string;
  competition: string;
  venue: string;
  minute: number;
  home: TeamInfo;
  away: TeamInfo;
  initialHomeScore: number;
  initialAwayScore: number;
}

export interface GoalEvent {
  id: string;
  side: TeamSide;
  teamCode: string;
  teamName: string;
  teamColor: string;
  scorer: string;
  minute: number;
  homeScore: number;
  awayScore: number;
  timestamp: number;
}

export const WALLPAPERS: Record<
  WallpaperId,
  { id: WallpaperId; label: string; src: string; fallbackGradient: string }
> = {
  stadium: {
    id: 'stadium',
    label: 'Stadium Dusk',
    src: '/src/assets/images/phone_wallpaper_stadium_1795352328080.jpg',
    fallbackGradient: 'linear-gradient(180deg, #070B14 0%, #10192B 55%, #1E293B 100%)',
  },
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian Silk',
    src: '/src/assets/images/phone_wallpaper_obsidian_1795352327594.jpg',
    fallbackGradient: 'linear-gradient(180deg, #090A0D 0%, #16181F 60%, #262933 100%)',
  },
};

export const TEAM_COLOR_SWATCHES = [
  { name: 'Arsenal Red', hex: '#EF0107' },
  { name: 'Sky Blue', hex: '#5BB6E5' },
  { name: 'Royal Gold', hex: '#F4C430' },
  { name: 'Blaugrana Crimson', hex: '#C81D4E' },
  { name: 'Anfield Scarlet', hex: '#D00027' },
  { name: 'Cobalt Blue', hex: '#1B5BE8' },
  { name: 'Pitch Emerald', hex: '#10B981' },
  { name: 'Dortmund Yellow', hex: '#FDE100' },
  { name: 'Tangerine', hex: '#F97316' },
  { name: 'Electric Violet', hex: '#8B5CF6' },
];

export const FIXTURE_PRESETS: FixturePreset[] = [
  {
    id: 'ars-mci',
    competition: 'Premier League',
    venue: 'Emirates Stadium',
    minute: 64,
    initialHomeScore: 1,
    initialAwayScore: 1,
    home: {
      code: 'ARS',
      name: 'Arsenal',
      color: '#EF0107',
      scorers: ['B. Saka', 'M. Ødegaard', 'K. Havertz', 'G. Martinelli', 'D. Rice'],
    },
    away: {
      code: 'MCI',
      name: 'Man City',
      color: '#6CABDD',
      scorers: ['E. Haaland', 'P. Foden', 'K. De Bruyne', 'B. Silva', 'J. Doku'],
    },
  },
  {
    id: 'rma-fcb',
    competition: 'La Liga',
    venue: 'Santiago Bernabéu',
    minute: 71,
    initialHomeScore: 2,
    initialAwayScore: 1,
    home: {
      code: 'RMA',
      name: 'Real Madrid',
      color: '#F4C430',
      scorers: ['K. Mbappé', 'Vinícius Jr', 'J. Bellingham', 'Rodrygo', 'F. Valverde'],
    },
    away: {
      code: 'FCB',
      name: 'Barcelona',
      color: '#C81D4E',
      scorers: ['L. Yamal', 'R. Lewandowski', 'Raphinha', 'Pedri', 'D. Olmo'],
    },
  },
  {
    id: 'liv-che',
    competition: 'Premier League',
    venue: 'Anfield',
    minute: 58,
    initialHomeScore: 1,
    initialAwayScore: 0,
    home: {
      code: 'LIV',
      name: 'Liverpool',
      color: '#D00027',
      scorers: ['M. Salah', 'L. Díaz', 'D. Jota', 'C. Gakpo', 'A. Mac Allister'],
    },
    away: {
      code: 'CHE',
      name: 'Chelsea',
      color: '#2563EB',
      scorers: ['C. Palmer', 'N. Jackson', 'N. Madueke', 'P. Neto', 'E. Fernández'],
    },
  },
  {
    id: 'acm-int',
    competition: 'Serie A',
    venue: 'San Siro',
    minute: 78,
    initialHomeScore: 1,
    initialAwayScore: 1,
    home: {
      code: 'ACM',
      name: 'AC Milan',
      color: '#E11D2E',
      scorers: ['R. Leão', 'C. Pulisic', 'Á. Morata', 'T. Reijnders', 'T. Hernández'],
    },
    away: {
      code: 'INT',
      name: 'Inter Milan',
      color: '#2B62F0',
      scorers: ['L. Martínez', 'M. Thuram', 'N. Barella', 'H. Çalhanoğlu', 'F. Dimarco'],
    },
  },
  {
    id: 'bay-bvb',
    competition: 'Bundesliga',
    venue: 'Allianz Arena',
    minute: 66,
    initialHomeScore: 2,
    initialAwayScore: 2,
    home: {
      code: 'BAY',
      name: 'Bayern Munich',
      color: '#DC052D',
      scorers: ['H. Kane', 'J. Musiala', 'M. Olise', 'L. Sané', 'J. Kimmich'],
    },
    away: {
      code: 'BVB',
      name: 'Dortmund',
      color: '#FDE100',
      scorers: ['S. Guirassy', 'K. Adeyemi', 'J. Brandt', 'J. Gittens', 'M. Sabitzer'],
    },
  },
];

/** Converts a hex color (#RRGGBB) to an rgba string safely. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').trim();
  const normalized =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const intVal = Number.parseInt(normalized, 16);
  if (Number.isNaN(intVal)) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Returns true if the hex color is perceptually bright (so dark text should sit on it). */
export function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '').trim();
  const normalized =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const intVal = Number.parseInt(normalized, 16);
  if (Number.isNaN(intVal)) return false;
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62;
}
