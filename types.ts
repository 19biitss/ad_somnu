export enum View {
  BREATHING = 'BREATHING',
  MUSIC = 'MUSIC',
  HIPNOS = 'HIPNOS',
  TENGU = 'TENGU',
  SETTINGS = 'SETTINGS',
}

export enum Language {
  ES = 'es', // Castellano
  CA = 'ca', // Catalán
  EN = 'en', // Inglés
  FR = 'fr', // Francés
  DE = 'de', // Alemán
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface MusicTrack {
  id: number;
  title: string;
  category: 'nature' | 'melody';
  hzDescription?: string; // e.g., "432Hz"
  url?: string; // Placeholder for actual audio source
}
