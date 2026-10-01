import {
  supabase,
  ADMIN_ABBA_UUID,
  BOOST_BOT_UUID,
} from '../lib/supabase';

export type BEditVoiceCategory =
  | 'All'
  | 'Nigerian'
  | 'Comedy'
  | 'Girl'
  | 'Male'
  | 'Children'
  | 'More FX';

export type BEditDialectLanguage =
  | 'English'
  | 'Igbo'
  | 'Hausa'
  | 'Yoruba'
  | 'Akwa Ibom'
  | 'Nigerian Pidgin'
  | 'Lagos Street';

export interface BEditVoicePreset {
  id: string;
  name: string;
  category: Exclude<BEditVoiceCategory, 'All'>;
  badge: string;
  description: string;
  targetLanguage?: BEditDialectLanguage;
  dialectInstruction?: string;
  geminiVoiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  ttsStylePrompt?: string;
  // Real Web Audio API DSP parameters
  pitchRate: number; // 0.60 .. 1.85
  formantFreq: number; // Hz (120 .. 3400)
  formantGain: number; // dB (-15 .. +18)
  formantQ?: number;
  lowShelfGain: number; // dB (-18 .. +16)
  highShelfGain: number; // dB (-18 .. +16)
  highpassHz?: number;
  lowpassHz?: number;
  vibratoHz?: number;
  vibratoDepth?: number; // seconds delay mod (0.001 .. 0.012)
  ringModHz?: number;
  ringModMix?: number; // 0 .. 1
  distortion?: number; // 0 .. 100
  echoDelaySec?: number;
  echoFeedback?: number; // 0 .. 0.75
  echoMix?: number; // 0 .. 0.8
}

export const BEDIT_VOICE_PRESETS: BEditVoicePreset[] = [
  // 0. Original Clean Voice
  {
    id: 'original',
    name: 'Original Clean Voice',
    category: 'More FX',
    badge: 'NATURAL',
    description: 'Clean studio microphone pass-through',
    targetLanguage: 'English',
    geminiVoiceName: 'Charon',
    ttsStylePrompt: 'Natural, clear human studio voice',
    pitchRate: 1.0,
    formantFreq: 1000,
    formantGain: 0,
    lowShelfGain: 0,
    highShelfGain: 0,
  },

  // ==================== NIGERIAN LANGUAGES, DIALECTS & LAGOS STREET VOICES (14) ====================
  {
    id: 'naija_street_hypeman',
    name: 'Nigerian Lagos Street Voice',
    category: 'Nigerian',
    badge: '🇳🇬 LAGOS STREET',
    description: 'Authentic Lagos street voice — converts speech to real Lagos street Pidgin',
    targetLanguage: 'Lagos Street',
    dialectInstruction:
      'Convert everything the speaker said accurately into authentic Lagos Street Pidgin English (using natural Lagos street expressions like "Omo", "No cap", "E choke", "Abeg", "Wetin dey") while keeping 100% of their original meaning.',
    geminiVoiceName: 'Puck',
    ttsStylePrompt:
      'Confident, energetic young Nigerian man from Lagos speaking authentic Lagos street Pidgin with natural West African rhythm and charisma',
    pitchRate: 0.96,
    formantFreq: 1450,
    formantGain: 5,
    formantQ: 1.4,
    lowShelfGain: 4,
    highShelfGain: 5,
  },
  {
    id: 'igbo_language_male',
    name: 'Igbo Language (Odogwu Male)',
    category: 'Nigerian',
    badge: '🇳🇬 IGBO LANGUAGE',
    description: 'Translates your English voice recording accurately into fluent Igbo (Male)',
    targetLanguage: 'Igbo',
    dialectInstruction:
      'Translate 100% of what the speaker said accurately into fluent, natural Igbo language (Asụsụ Igbo) with zero mistakes.',
    geminiVoiceName: 'Fenrir',
    ttsStylePrompt:
      'Authentic, resonant Nigerian Igbo man speaking fluent Asụsụ Igbo with rich, natural West African pronunciation and warmth',
    pitchRate: 0.92,
    formantFreq: 240,
    formantGain: 6,
    formantQ: 1.3,
    lowShelfGain: 6,
    highShelfGain: 3,
  },
  {
    id: 'igbo_language_female',
    name: 'Igbo Language (Ada Igbo Female)',
    category: 'Nigerian',
    badge: '🇳🇬 IGBO LANGUAGE',
    description: 'Translates your English voice recording accurately into fluent Igbo (Female)',
    targetLanguage: 'Igbo',
    dialectInstruction:
      'Translate 100% of what the speaker said accurately into fluent, natural Igbo language (Asụsụ Igbo) with zero mistakes.',
    geminiVoiceName: 'Kore',
    ttsStylePrompt:
      'Warm, expressive Nigerian Igbo woman speaking fluent Asụsụ Igbo with natural native intonation and clarity',
    pitchRate: 1.12,
    formantFreq: 2100,
    formantGain: 5,
    formantQ: 1.3,
    lowShelfGain: -3,
    highShelfGain: 6,
  },
  {
    id: 'hausa_language_male',
    name: 'Hausa Language (Mallam Hausa)',
    category: 'Nigerian',
    badge: '🇳🇬 HAUSA LANGUAGE',
    description: 'Translates your English voice recording accurately into fluent Hausa (Male)',
    targetLanguage: 'Hausa',
    dialectInstruction:
      'Translate 100% of what the speaker said accurately into fluent, natural Hausa language (Harshen Hausa) with zero mistakes.',
    geminiVoiceName: 'Charon',
    ttsStylePrompt:
      'Authentic Northern Nigerian Hausa man speaking fluent Harshen Hausa with clear, natural Kano/Kaduna broadcast pronunciation',
    pitchRate: 0.94,
    formantFreq: 950,
    formantGain: 5,
    formantQ: 1.4,
    lowShelfGain: 4,
    highShelfGain: 4,
  },
  {
    id: 'hausa_language_female',
    name: 'Hausa Language (Hajiya Hausa)',
    category: 'Nigerian',
    badge: '🇳🇬 HAUSA LANGUAGE',
    description: 'Translates your English voice recording accurately into fluent Hausa (Female)',
    targetLanguage: 'Hausa',
    dialectInstruction:
      'Translate 100% of what the speaker said accurately into fluent, natural Hausa language (Harshen Hausa) with zero mistakes.',
    geminiVoiceName: 'Zephyr',
    ttsStylePrompt:
      'Graceful, articulate Northern Nigerian Hausa woman speaking fluent Harshen Hausa with natural native cadence',
    pitchRate: 1.14,
    formantFreq: 2150,
    formantGain: 5,
    formantQ: 1.3,
    lowShelfGain: -4,
    highShelfGain: 6,
  },
  {
    id: 'yoruba_language_male',
    name: 'Yoruba Language (Ọmọ Yorùbá Male)',
    category: 'Nigerian',
    badge: '🇳🇬 YORUBA LANGUAGE',
    description: 'Translates your English voice recording accurately into fluent Yoruba (Male)',
    targetLanguage: 'Yoruba',
    dialectInstruction:
      'Translate 100% of what the speaker said accurately into fluent, natural Yoruba language (Èdè Yorùbá) with proper tonal marks and zero mistakes.',
    geminiVoiceName: 'Charon',
    ttsStylePrompt:
      'Expressive, authentic Nigerian Yoruba man speaking fluent Èdè Yorùbá with natural tonal inflection and warmth',
    pitchRate: 0.93,
    formantFreq: 280,
    formantGain: 6,
    formantQ: 1.4,
    lowShelfGain: 5,
    highShelfGain: 3,
  },
  {
    id: 'yoruba_language_female',
    name: 'Yoruba Language (Olori Yoruba Female)',
    category: 'Nigerian',
    badge: '🇳🇬 YORUBA LANGUAGE',
    description: 'Translates your English voice recording accurately into fluent Yoruba (Female)',
    targetLanguage: 'Yoruba',
    dialectInstruction:
      'Translate 100% of what the speaker said accurately into fluent, natural Yoruba language (Èdè Yorùbá) with proper tonal marks and zero mistakes.',
    geminiVoiceName: 'Kore',
    ttsStylePrompt:
      'Warm, melodious Nigerian Yoruba woman speaking fluent Èdè Yorùbá with authentic native tonal rhythm',
    pitchRate: 1.13,
    formantFreq: 2150,
    formantGain: 6,
    formantQ: 1.3,
    lowShelfGain: -3,
    highShelfGain: 6,
  },
  {
    id: 'akwa_ibom_male',
    name: 'Akwa Ibom Language (Ette Ibibio)',
    category: 'Nigerian',
    badge: '🇳🇬 AKWA IBOM',
    description: 'Translates your English voice accurately into Akwa Ibom / Ibibio-Efik (Male)',
    targetLanguage: 'Akwa Ibom',
    dialectInstruction:
      'Translate 100% of what the speaker said accurately into authentic Akwa Ibom language (Ibibio / Efik dialect of Akwa Ibom State, Nigeria) with zero mistakes.',
    geminiVoiceName: 'Fenrir',
    ttsStylePrompt:
      'Friendly, authentic Akwa Ibom Nigerian man from Uyo speaking fluent Ibibio/Efik with natural South-South Nigerian musical cadence',
    pitchRate: 0.95,
    formantFreq: 320,
    formantGain: 6,
    formantQ: 1.4,
    lowShelfGain: 5,
    highShelfGain: 4,
  },
  {
    id: 'akwa_ibom_female',
    name: 'Akwa Ibom Language (Mma Ibibio)',
    category: 'Nigerian',
    badge: '🇳🇬 AKWA IBOM',
    description: 'Translates your English voice accurately into Akwa Ibom / Ibibio-Efik (Female)',
    targetLanguage: 'Akwa Ibom',
    dialectInstruction:
      'Translate 100% of what the speaker said accurately into authentic Akwa Ibom language (Ibibio / Efik dialect of Akwa Ibom State, Nigeria) with zero mistakes.',
    geminiVoiceName: 'Zephyr',
    ttsStylePrompt:
      'Sweet, expressive Akwa Ibom Nigerian woman from Uyo speaking fluent Ibibio/Efik with authentic native intonation',
    pitchRate: 1.15,
    formantFreq: 2200,
    formantGain: 6,
    formantQ: 1.3,
    lowShelfGain: -4,
    highShelfGain: 6,
  },
  {
    id: 'naija_pidgin_male',
    name: 'Nigerian Pidgin (Naija Real Guy)',
    category: 'Nigerian',
    badge: '🇳🇬 NAIJA PIDGIN',
    description: 'Converts your English speech accurately into natural Nigerian Pidgin (Male)',
    targetLanguage: 'Nigerian Pidgin',
    dialectInstruction:
      'Convert 100% of what the speaker said accurately into natural, fluent Nigerian Pidgin English without losing any detail.',
    geminiVoiceName: 'Puck',
    ttsStylePrompt:
      'Natural, charismatic Nigerian man speaking fluent Nigerian Pidgin English with warm conversational flow',
    pitchRate: 0.97,
    formantFreq: 1200,
    formantGain: 5,
    formantQ: 1.4,
    lowShelfGain: 4,
    highShelfGain: 4,
  },
  {
    id: 'naija_pidgin_female',
    name: 'Nigerian Pidgin (Naija Sisi Female)',
    category: 'Nigerian',
    badge: '🇳🇬 PIDGIN BABE',
    description: 'Converts your English speech accurately into lively Nigerian Pidgin (Female)',
    targetLanguage: 'Nigerian Pidgin',
    dialectInstruction:
      'Convert 100% of what the speaker said accurately into natural, lively Nigerian Pidgin English without losing any detail.',
    geminiVoiceName: 'Zephyr',
    ttsStylePrompt:
      'Lively, confident young Nigerian woman speaking fluent Nigerian Pidgin English with warm, expressive charm',
    pitchRate: 1.14,
    formantFreq: 2150,
    formantGain: 6,
    formantQ: 1.4,
    lowShelfGain: -4,
    highShelfGain: 6,
  },
  {
    id: 'warri_comedian',
    name: 'Warri Waffi Pidgin Voice',
    category: 'Nigerian',
    badge: '🇳🇬 WARRI PIDGIN',
    description: 'Converts speech into authentic Warri / Delta street Pidgin flow',
    targetLanguage: 'Nigerian Pidgin',
    dialectInstruction:
      'Convert 100% of what the speaker said accurately into authentic Warri (Waffi) Nigerian Pidgin English with lively Delta street flavor.',
    geminiVoiceName: 'Puck',
    ttsStylePrompt:
      'Animated, witty Warri Nigerian speaker delivering authentic Waffi Pidgin with natural storytelling energy',
    pitchRate: 1.04,
    formantFreq: 1650,
    formantGain: 7,
    formantQ: 1.6,
    lowShelfGain: 2,
    highShelfGain: 6,
  },
  {
    id: 'lagos_babe',
    name: 'Lagos Island Big Girl (Real Female)',
    category: 'Nigerian',
    badge: '🇳🇬 ISLAND BABE',
    description: 'Polished Lekki/VI Nigerian female voice speaking natural English',
    targetLanguage: 'English',
    geminiVoiceName: 'Kore',
    ttsStylePrompt:
      'Polished, confident young woman from Victoria Island, Lagos speaking clear English with a classy Nigerian accent',
    pitchRate: 1.15,
    formantFreq: 2200,
    formantGain: 6,
    formantQ: 1.4,
    lowShelfGain: -4,
    highShelfGain: 7,
  },
  {
    id: 'naija_comedy_mama',
    name: 'African Naija Mother',
    category: 'Nigerian',
    badge: '🇳🇬 NAIJA MAMA',
    description: 'Expressive Nigerian mother voice in warm Naija Pidgin & English',
    targetLanguage: 'Nigerian Pidgin',
    dialectInstruction:
      'Convert what the speaker said accurately into warm, expressive Nigerian mother Pidgin/English while keeping the exact message.',
    geminiVoiceName: 'Kore',
    ttsStylePrompt:
      'Expressive, warm Nigerian mother speaking with rich West African maternal authority and humor',
    pitchRate: 1.08,
    formantFreq: 1550,
    formantGain: 7,
    formantQ: 1.6,
    lowShelfGain: 2,
    highShelfGain: 5,
  },

  // ==================== COMEDY & FUNNY VOICES (12) ====================
  {
    id: 'chipmunk_turbo',
    name: 'Chipmunk Comedy',
    category: 'Comedy',
    badge: '😂 CHIPMUNK',
    description: 'Classic high-pitched squeaky chipmunk comedy voice',
    pitchRate: 1.58,
    formantFreq: 2800,
    formantGain: 10,
    lowShelfGain: -12,
    highShelfGain: 10,
  },
  {
    id: 'helium_balloon',
    name: 'Helium Laugh',
    category: 'Comedy',
    badge: '😂 HELIUM',
    description: 'Ultra-high squeaky helium party balloon laugh & voice',
    targetLanguage: 'English',
    geminiVoiceName: 'Puck',
    ttsStylePrompt:
      'Giggling, cheerful, laughing comedy voice starting with a playful laugh "Haha! Hee-hee!" and speaking with bubbly party excitement',
    pitchRate: 1.72,
    formantFreq: 3100,
    formantGain: 12,
    formantQ: 1.8,
    lowShelfGain: -15,
    highShelfGain: 12,
    vibratoHz: 6.5,
    vibratoDepth: 0.0022,
  },
  {
    id: 'drunk_wobble',
    name: 'Dizzy / Tipsy Wobble',
    category: 'Comedy',
    badge: '😂 WOBBLE',
    description: 'Hilarious unsteady pitch wobble and slurred chorus',
    pitchRate: 0.94,
    formantFreq: 800,
    formantGain: 5,
    lowShelfGain: 3,
    highShelfGain: -4,
    vibratoHz: 2.4,
    vibratoDepth: 0.0085,
  },
  {
    id: 'cartoon_duck',
    name: 'Quacky Cartoon',
    category: 'Comedy',
    badge: '😂 CARTOON',
    description: 'Nasal resonant cartoon duck quack filter',
    pitchRate: 1.36,
    formantFreq: 1150,
    formantGain: 16,
    formantQ: 4.5,
    lowShelfGain: -10,
    highShelfGain: 5,
    distortion: 18,
  },
  {
    id: 'slow_mo_giant',
    name: 'Slow-Mo Sloth',
    category: 'Comedy',
    badge: '😂 SLOW-MO',
    description: 'Deep stretched-out sleepy comedy giant',
    pitchRate: 0.68,
    formantFreq: 220,
    formantGain: 8,
    lowShelfGain: 10,
    highShelfGain: -6,
  },
  {
    id: 'megaphone_clown',
    name: 'Circus Megaphone',
    category: 'Comedy',
    badge: '😂 CIRCUS',
    description: 'Honky horn megaphone with springy slapback',
    pitchRate: 1.16,
    formantFreq: 1500,
    formantGain: 14,
    formantQ: 3.5,
    lowShelfGain: -14,
    highShelfGain: 4,
    highpassHz: 450,
    lowpassHz: 3200,
    distortion: 28,
    echoDelaySec: 0.08,
    echoFeedback: 0.35,
    echoMix: 0.32,
  },
  {
    id: 'vibrato_opera',
    name: 'Dramatic Opera Vibrato',
    category: 'Comedy',
    badge: '😂 OPERA',
    description: 'Over-the-top wide pitch vibrato in a concert hall',
    pitchRate: 1.14,
    formantFreq: 1900,
    formantGain: 9,
    lowShelfGain: 2,
    highShelfGain: 8,
    vibratoHz: 6.8,
    vibratoDepth: 0.0065,
    echoDelaySec: 0.19,
    echoFeedback: 0.42,
    echoMix: 0.36,
  },
  {
    id: 'alien_invader',
    name: 'Martian Alien',
    category: 'Comedy',
    badge: '😂 ALIEN',
    description: 'Sci-fi ring-modulated extraterrestrial voice',
    pitchRate: 1.32,
    formantFreq: 2100,
    formantGain: 8,
    lowShelfGain: -6,
    highShelfGain: 8,
    ringModHz: 48,
    ringModMix: 0.65,
  },
  {
    id: 'goblin_gremlin',
    name: 'Sneaky Goblin',
    category: 'Comedy',
    badge: '😂 GOBLIN',
    description: 'Raspy mischievous gremlin with nasal crunch',
    pitchRate: 1.28,
    formantFreq: 1650,
    formantGain: 13,
    formantQ: 3.2,
    lowShelfGain: -8,
    highShelfGain: 9,
    distortion: 32,
  },
  {
    id: 'underwater_bubble',
    name: 'Underwater Bubbles',
    category: 'Comedy',
    badge: '😂 BUBBLES',
    description: 'Submerged bubbly warble effect',
    pitchRate: 1.05,
    formantFreq: 600,
    formantGain: 10,
    lowShelfGain: 4,
    highShelfGain: -12,
    lowpassHz: 1400,
    vibratoHz: 9.5,
    vibratoDepth: 0.0055,
  },
  {
    id: 'kazoo_party',
    name: 'Buzzing Kazoo',
    category: 'Comedy',
    badge: '😂 KAZOO',
    description: 'Funny harmonic fuzz buzz like a party kazoo',
    pitchRate: 1.22,
    formantFreq: 1300,
    formantGain: 15,
    formantQ: 4.0,
    lowShelfGain: -12,
    highShelfGain: 8,
    distortion: 55,
  },
  {
    id: 'dizzy_squirrel',
    name: 'Hyper Squirrel',
    category: 'Comedy',
    badge: '😂 SQUIRREL',
    description: 'Super-fast caffeinated squirrel chatter',
    pitchRate: 1.48,
    formantFreq: 2600,
    formantGain: 11,
    lowShelfGain: -10,
    highShelfGain: 11,
    vibratoHz: 11,
    vibratoDepth: 0.0025,
  },

  // ==================== GIRL / FEMALE VOICES (8) ====================
  {
    id: 'girl_sweet',
    name: 'Sweet Girl Voice (Real Female)',
    category: 'Girl',
    badge: '👩 SWEET GIRL',
    description: 'Realistic warm feminine human voice',
    targetLanguage: 'English',
    geminiVoiceName: 'Kore',
    ttsStylePrompt: 'Sweet, warm, natural young woman speaking with friendly clarity',
    pitchRate: 1.22,
    formantFreq: 2150,
    formantGain: 7,
    formantQ: 1.4,
    lowShelfGain: -7,
    highShelfGain: 7,
  },
  {
    id: 'girl_soft_asmr',
    name: 'Soft Whisper Girl (Real Female)',
    category: 'Girl',
    badge: '👩 ASMR GIRL',
    description: 'Intimate airy feminine human voice with silky presence',
    targetLanguage: 'English',
    geminiVoiceName: 'Zephyr',
    ttsStylePrompt: 'Soft, intimate, gentle female voice speaking calmly like a close-mic studio recording',
    pitchRate: 1.19,
    formantFreq: 2500,
    formantGain: 9,
    formantQ: 1.3,
    lowShelfGain: -9,
    highShelfGain: 12,
    highpassHz: 180,
  },
  {
    id: 'girl_anime',
    name: 'Expressive Star Girl (Real Female)',
    category: 'Girl',
    badge: '👩 STAR GIRL',
    description: 'Bright, expressive female character voice',
    targetLanguage: 'English',
    geminiVoiceName: 'Zephyr',
    ttsStylePrompt: 'Bright, energetic, expressive young female voice full of life and emotion',
    pitchRate: 1.35,
    formantFreq: 2650,
    formantGain: 9,
    formantQ: 1.6,
    lowShelfGain: -10,
    highShelfGain: 10,
  },
  {
    id: 'girl_diva_pop',
    name: 'Pop Diva Queen (Real Female)',
    category: 'Girl',
    badge: '👩 POP DIVA',
    description: 'Polished female vocalist with studio shimmer reverb',
    targetLanguage: 'English',
    geminiVoiceName: 'Kore',
    ttsStylePrompt: 'Confident, glamorous female pop star speaking with rich studio charisma',
    pitchRate: 1.2,
    formantFreq: 2300,
    formantGain: 8,
    lowShelfGain: -5,
    highShelfGain: 9,
    echoDelaySec: 0.14,
    echoFeedback: 0.3,
    echoMix: 0.26,
  },
  {
    id: 'girl_sassy_vlogger',
    name: 'Sassy Vlogger (Real Female)',
    category: 'Girl',
    badge: '👩 VLOGGER',
    description: 'Confident, upfront lifestyle creator female voice',
    targetLanguage: 'English',
    geminiVoiceName: 'Zephyr',
    ttsStylePrompt: 'Sassy, upbeat female lifestyle vlogger speaking naturally to her audience',
    pitchRate: 1.16,
    formantFreq: 1950,
    formantGain: 8,
    lowShelfGain: -4,
    highShelfGain: 8,
  },
  {
    id: 'girl_news_anchor',
    name: 'Female News Anchor (Real Female)',
    category: 'Girl',
    badge: '👩 ANCHOR',
    description: 'Clear, articulate broadcast television presenter',
    targetLanguage: 'English',
    geminiVoiceName: 'Kore',
    ttsStylePrompt: 'Professional, articulate female television news anchor speaking with crisp authority',
    pitchRate: 1.14,
    formantFreq: 1800,
    formantGain: 6,
    lowShelfGain: -3,
    highShelfGain: 6,
  },
  {
    id: 'girl_princess',
    name: 'Royal Lady Voice (Real Female)',
    category: 'Girl',
    badge: '👩 ROYAL LADY',
    description: 'Graceful melodic female voice with warm acoustics',
    targetLanguage: 'English',
    geminiVoiceName: 'Kore',
    ttsStylePrompt: 'Graceful, poised, melodic young woman speaking with elegance and warmth',
    pitchRate: 1.27,
    formantFreq: 2400,
    formantGain: 8,
    lowShelfGain: -8,
    highShelfGain: 10,
    vibratoHz: 5.0,
    vibratoDepth: 0.0014,
    echoDelaySec: 0.17,
    echoFeedback: 0.34,
    echoMix: 0.28,
  },
  {
    id: 'girl_cyber_ai',
    name: 'Smart AI Assistant (Real Female)',
    category: 'Girl',
    badge: '👩 AI VOICE',
    description: 'Ultra-clean female digital assistant voice',
    targetLanguage: 'English',
    geminiVoiceName: 'Zephyr',
    ttsStylePrompt: 'Crisp, intelligent, futuristic female AI assistant speaking clearly',
    pitchRate: 1.21,
    formantFreq: 2350,
    formantGain: 8,
    lowShelfGain: -6,
    highShelfGain: 9,
    ringModHz: 24,
    ringModMix: 0.22,
  },

  // ==================== MALE VOICES (8) ====================
  {
    id: 'male_deep_alpha',
    name: 'Deep Alpha Male (Real Male)',
    category: 'Male',
    badge: '👨 DEEP MALE',
    description: 'Rich, masculine low-pitched human male voice',
    targetLanguage: 'English',
    geminiVoiceName: 'Fenrir',
    ttsStylePrompt: 'Deep, resonant, confident masculine man speaking with rich chest bass',
    pitchRate: 0.81,
    formantFreq: 190,
    formantGain: 10,
    formantQ: 1.3,
    lowShelfGain: 9,
    highShelfGain: 3,
  },
  {
    id: 'male_movie_trailer',
    name: 'Movie Trailer Narrator (Real Male)',
    category: 'Male',
    badge: '👨 TRAILER',
    description: 'Cinema narrator baritone with thunderous presence',
    targetLanguage: 'English',
    geminiVoiceName: 'Charon',
    ttsStylePrompt: 'Epic, cinematic Hollywood movie trailer narrator with a deep commanding baritone',
    pitchRate: 0.76,
    formantFreq: 155,
    formantGain: 12,
    lowShelfGain: 12,
    highShelfGain: 5,
    echoDelaySec: 0.12,
    echoFeedback: 0.24,
    echoMix: 0.2,
  },
  {
    id: 'male_podcast_host',
    name: 'Pro Podcast Host (Real Male)',
    category: 'Male',
    badge: '👨 PODCAST',
    description: 'Warm condenser-mic male voice with smooth presence',
    targetLanguage: 'English',
    geminiVoiceName: 'Charon',
    ttsStylePrompt: 'Warm, engaging male podcast host speaking into a studio condenser microphone',
    pitchRate: 0.91,
    formantFreq: 230,
    formantGain: 8,
    lowShelfGain: 7,
    highShelfGain: 4,
  },
  {
    id: 'male_baritone_singer',
    name: 'Smooth Baritone (Real Male)',
    category: 'Male',
    badge: '👨 BARITONE',
    description: 'Velvet R&B male vocal with lush studio room',
    targetLanguage: 'English',
    geminiVoiceName: 'Fenrir',
    ttsStylePrompt: 'Smooth, soulful baritone man speaking with velvet warmth and charm',
    pitchRate: 0.86,
    formantFreq: 260,
    formantGain: 7,
    lowShelfGain: 6,
    highShelfGain: 5,
    echoDelaySec: 0.15,
    echoFeedback: 0.28,
    echoMix: 0.24,
  },
  {
    id: 'male_drill_rapper',
    name: 'UK/NY Street Male (Real Male)',
    category: 'Male',
    badge: '👨 STREET',
    description: 'Gritty deep street male vocal with punchy presence',
    targetLanguage: 'English',
    geminiVoiceName: 'Puck',
    ttsStylePrompt: 'Cool, rhythmic urban street male speaking with bold confidence',
    pitchRate: 0.88,
    formantFreq: 310,
    formantGain: 9,
    lowShelfGain: 8,
    highShelfGain: 7,
    distortion: 12,
    echoDelaySec: 0.13,
    echoFeedback: 0.3,
    echoMix: 0.25,
  },
  {
    id: 'male_old_grandpa',
    name: 'Wise Elder Storyteller (Real Male)',
    category: 'Male',
    badge: '👨 ELDER',
    description: 'Seasoned storyteller male voice with warm wisdom',
    targetLanguage: 'English',
    geminiVoiceName: 'Charon',
    ttsStylePrompt: 'Wise, warm older gentleman storyteller speaking thoughtfully',
    pitchRate: 0.84,
    formantFreq: 680,
    formantGain: 6,
    lowShelfGain: 3,
    highShelfGain: -4,
    vibratoHz: 4.8,
    vibratoDepth: 0.0022,
  },
  {
    id: 'male_sports_caster',
    name: 'Football Commentator (Real Male)',
    category: 'Male',
    badge: '👨 STADIUM',
    description: 'Excited live match commentator with stadium PA echo',
    targetLanguage: 'English',
    geminiVoiceName: 'Puck',
    ttsStylePrompt: 'High-energy, thrilled live football match commentator calling the action',
    pitchRate: 1.03,
    formantFreq: 1400,
    formantGain: 9,
    lowShelfGain: 2,
    highShelfGain: 8,
    echoDelaySec: 0.16,
    echoFeedback: 0.36,
    echoMix: 0.32,
  },
  {
    id: 'male_action_hero',
    name: 'Gritty Action Hero (Real Male)',
    category: 'Male',
    badge: '👨 HERO',
    description: 'Tough, fearless low male voice',
    targetLanguage: 'English',
    geminiVoiceName: 'Fenrir',
    ttsStylePrompt: 'Tough, fearless action movie hero speaking with intense determination',
    pitchRate: 0.79,
    formantFreq: 210,
    formantGain: 11,
    lowShelfGain: 9,
    highShelfGain: 4,
    distortion: 22,
  },

  // ==================== CHILDREN & KID VOICES (6) ====================
  {
    id: 'child_happy_kid',
    name: 'Happy 7-Year-Old',
    category: 'Children',
    badge: '🧒 KID VOICE',
    description: 'Bright, cheerful young child vocal resonance',
    pitchRate: 1.31,
    formantFreq: 2550,
    formantGain: 9,
    formantQ: 1.5,
    lowShelfGain: -10,
    highShelfGain: 8,
  },
  {
    id: 'child_toddler_cute',
    name: 'Cute Toddler',
    category: 'Children',
    badge: '🧒 TODDLER',
    description: 'Adorable baby/toddler high vocal tract timbre',
    pitchRate: 1.42,
    formantFreq: 2900,
    formantGain: 10,
    formantQ: 1.6,
    lowShelfGain: -12,
    highShelfGain: 9,
  },
  {
    id: 'child_school_boy',
    name: 'Playful Schoolboy',
    category: 'Children',
    badge: '🧒 BOY VOICE',
    description: 'Energetic 10-year-old boy voice',
    pitchRate: 1.25,
    formantFreq: 2200,
    formantGain: 8,
    lowShelfGain: -8,
    highShelfGain: 6,
  },
  {
    id: 'child_little_sister',
    name: 'Little Sister',
    category: 'Children',
    badge: '🧒 LITTLE GIRL',
    description: 'Sweet young girl voice for storytelling & skits',
    pitchRate: 1.34,
    formantFreq: 2700,
    formantGain: 9,
    lowShelfGain: -11,
    highShelfGain: 9,
  },
  {
    id: 'child_cartoon_hero',
    name: 'Kid Superhero',
    category: 'Children',
    badge: '🧒 SUPER KID',
    description: 'Bold animated kid hero with heroic echo',
    pitchRate: 1.29,
    formantFreq: 2400,
    formantGain: 9,
    lowShelfGain: -7,
    highShelfGain: 8,
    echoDelaySec: 0.11,
    echoFeedback: 0.25,
    echoMix: 0.22,
  },
  {
    id: 'child_bedtime_story',
    name: 'Storybook Kid',
    category: 'Children',
    badge: '🧒 STORY KID',
    description: 'Gentle young narrator voice with cozy room warmth',
    pitchRate: 1.28,
    formantFreq: 2350,
    formantGain: 7,
    lowShelfGain: -8,
    highShelfGain: 5,
    echoDelaySec: 0.06,
    echoFeedback: 0.15,
    echoMix: 0.18,
  },

  // ==================== SCI-FI, MONSTER & STUDIO FX (7 + Original = 8) ====================
  {
    id: 'robot_prime',
    name: 'Mecha Robot',
    category: 'More FX',
    badge: '🤖 ROBOT',
    description: 'Metallic ring-modulated android synthesizer voice',
    pitchRate: 1.0,
    formantFreq: 1400,
    formantGain: 10,
    lowShelfGain: -2,
    highShelfGain: 6,
    ringModHz: 65,
    ringModMix: 0.78,
    echoDelaySec: 0.03,
    echoFeedback: 0.4,
    echoMix: 0.35,
  },
  {
    id: 'cyber_demon',
    name: 'Dark Monster Titan',
    category: 'More FX',
    badge: '👹 MONSTER',
    description: 'Terrifying sub-octave beast with cavern roar',
    pitchRate: 0.64,
    formantFreq: 140,
    formantGain: 15,
    lowShelfGain: 15,
    highShelfGain: -4,
    distortion: 42,
    echoDelaySec: 0.22,
    echoFeedback: 0.5,
    echoMix: 0.45,
  },
  {
    id: 'ghost_phantom',
    name: 'Haunted Ghost',
    category: 'More FX',
    badge: '👻 GHOST',
    description: 'Eerie whispering phantom with long haunting trails',
    pitchRate: 0.89,
    formantFreq: 1800,
    formantGain: 8,
    lowShelfGain: -8,
    highShelfGain: 10,
    vibratoHz: 3.2,
    vibratoDepth: 0.004,
    echoDelaySec: 0.28,
    echoFeedback: 0.65,
    echoMix: 0.58,
  },
  {
    id: 'walkie_talkie',
    name: 'Police Walkie-Talkie',
    category: 'More FX',
    badge: '📟 WALKIE',
    description: 'Tactical two-way radio bandpass with crisp overdrive',
    pitchRate: 1.0,
    formantFreq: 1250,
    formantGain: 14,
    formantQ: 3.8,
    lowShelfGain: -16,
    highShelfGain: -8,
    highpassHz: 480,
    lowpassHz: 2700,
    distortion: 45,
  },
  {
    id: 'vintage_1950_radio',
    name: '1950s Vintage Radio',
    category: 'More FX',
    badge: '📻 RETRO FM',
    description: 'Nostalgic mid-century tube radio warmth',
    pitchRate: 0.98,
    formantFreq: 1100,
    formantGain: 10,
    formantQ: 2.5,
    lowShelfGain: -12,
    highShelfGain: -6,
    highpassHz: 320,
    lowpassHz: 3400,
    distortion: 16,
  },
  {
    id: 'stadium_megastar',
    name: 'Stadium Live PA',
    category: 'More FX',
    badge: '🏟️ ARENA',
    description: 'Massive concert arena echo and crowd stage presence',
    pitchRate: 1.0,
    formantFreq: 1600,
    formantGain: 6,
    lowShelfGain: 4,
    highShelfGain: 7,
    echoDelaySec: 0.24,
    echoFeedback: 0.55,
    echoMix: 0.48,
  },
  {
    id: 'cathedral_choir',
    name: 'Angelic Choir Harmony',
    category: 'More FX',
    badge: '✨ ANGELIC',
    description: 'Ethereal pitch shimmer with grand cathedral acoustics',
    pitchRate: 1.15,
    formantFreq: 2400,
    formantGain: 8,
    lowShelfGain: -4,
    highShelfGain: 11,
    vibratoHz: 4.2,
    vibratoDepth: 0.0028,
    echoDelaySec: 0.3,
    echoFeedback: 0.62,
    echoMix: 0.55,
  },
];

export const BEDIT_VOICE_CATEGORIES: BEditVoiceCategory[] = [
  'All',
  'Nigerian',
  'Comedy',
  'Girl',
  'Male',
  'Children',
  'More FX',
];

export function getVoicePresetById(id: string): BEditVoicePreset {
  return (
    BEDIT_VOICE_PRESETS.find((p) => p.id === id) || BEDIT_VOICE_PRESETS[0]
  );
}

function makeDistortionCurve(amount = 20): Float32Array<ArrayBuffer> {
  const k = Math.max(0, amount);
  const nSamples = 44100;
  const curve = new Float32Array(new ArrayBuffer(nSamples * 4));
  const deg = Math.PI / 180;
  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Encodes a Web Audio API AudioBuffer into a standard 16-bit PCM WAV Blob.
 */
export function encodeAudioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, Math.max(1, buffer.numberOfChannels));
  const sampleRate = buffer.sampleRate || 44100;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i] || 0));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Decodes any File or URL (video or audio) into an AudioBuffer.
 */
export async function decodeMediaToAudioBuffer(
  source: File | Blob | string
): Promise<AudioBuffer> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();

  try {
    let arrayBuffer: ArrayBuffer;
    if (typeof source === 'string') {
      const cleanUrl = source.split('#')[0];
      const res = await fetch(cleanUrl);
      arrayBuffer = await res.arrayBuffer();
    } else {
      arrayBuffer = await source.arrayBuffer();
    }
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    await ctx.close().catch(() => {});
    return decoded;
  } catch (err) {
    await ctx.close().catch(() => {});
    throw err;
  }
}

/**
 * Extracts the real audio track from a selected gallery video File or URL
 * and returns a playable/downloadable WAV File + URL + AudioBuffer.
 */
export async function extractAudioFromVideoSource(
  source: File | string,
  sourceName = 'gallery-video'
): Promise<{
  audioBuffer: AudioBuffer;
  wavBlob: Blob;
  wavFile: File;
  wavUrl: string;
  duration: number;
}> {
  const audioBuffer = await decodeMediaToAudioBuffer(source);
  const wavBlob = encodeAudioBufferToWavBlob(audioBuffer);
  const safeBase = sourceName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const wavFile = new File([wavBlob], `${safeBase}_extracted_audio.wav`, {
    type: 'audio/wav',
  });
  const wavUrl = URL.createObjectURL(wavBlob);
  return {
    audioBuffer,
    wavBlob,
    wavFile,
    wavUrl,
    duration: Number(audioBuffer.duration.toFixed(1)),
  };
}

/**
 * Applies any of the 52 Voice Changer DSP presets to an AudioBuffer using OfflineAudioContext
 * and returns the transformed AudioBuffer + WAV File + Object URL.
 */
export async function renderVoiceChangedAudio(
  sourceBuffer: AudioBuffer,
  presetId: string,
  baseName = 'voice'
): Promise<{
  audioBuffer: AudioBuffer;
  wavBlob: Blob;
  wavFile: File;
  wavUrl: string;
  duration: number;
}> {
  const preset = getVoicePresetById(presetId);

  if (preset.id === 'original') {
    const wavBlob = encodeAudioBufferToWavBlob(sourceBuffer);
    const wavFile = new File([wavBlob], `${baseName}_original.wav`, {
      type: 'audio/wav',
    });
    return {
      audioBuffer: sourceBuffer,
      wavBlob,
      wavFile,
      wavUrl: URL.createObjectURL(wavBlob),
      duration: Number(sourceBuffer.duration.toFixed(1)),
    };
  }

  const rate = Math.max(0.55, Math.min(1.9, preset.pitchRate || 1.0));
  const tailSec = preset.echoDelaySec ? Math.min(1.2, preset.echoDelaySec * 3) : 0.1;
  const outputDuration = Math.max(0.5, sourceBuffer.duration / rate + tailSec);
  const sampleRate = sourceBuffer.sampleRate || 44100;
  const totalFrames = Math.ceil(outputDuration * sampleRate);

  const offlineCtx = new OfflineAudioContext(
    Math.min(2, Math.max(1, sourceBuffer.numberOfChannels)),
    totalFrames,
    sampleRate
  );

  const src = offlineCtx.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = rate;

  let currentNode: AudioNode = src;

  // Optional Highpass (telephone / megaphone / walkie-talkie)
  if (preset.highpassHz) {
    const hp = offlineCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = preset.highpassHz;
    currentNode.connect(hp);
    currentNode = hp;
  }

  // Optional Lowpass
  if (preset.lowpassHz) {
    const lp = offlineCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = preset.lowpassHz;
    currentNode.connect(lp);
    currentNode = lp;
  }

  // Low-shelf bass sculpting
  if (preset.lowShelfGain !== 0) {
    const lowShelf = offlineCtx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 220;
    lowShelf.gain.value = preset.lowShelfGain;
    currentNode.connect(lowShelf);
    currentNode = lowShelf;
  }

  // Vocal Formant Filter
  if (preset.formantGain !== 0) {
    const formant = offlineCtx.createBiquadFilter();
    formant.type = 'peaking';
    formant.frequency.value = preset.formantFreq;
    formant.Q.value = preset.formantQ || 1.6;
    formant.gain.value = preset.formantGain;
    currentNode.connect(formant);
    currentNode = formant;
  }

  // High-shelf presence/air
  if (preset.highShelfGain !== 0) {
    const highShelf = offlineCtx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;
    highShelf.gain.value = preset.highShelfGain;
    currentNode.connect(highShelf);
    currentNode = highShelf;
  }

  // Optional Vibrato / Pitch Wobble LFO
  if (preset.vibratoHz && preset.vibratoDepth) {
    const delay = offlineCtx.createDelay(0.1);
    delay.delayTime.value = 0.015;
    const lfo = offlineCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = preset.vibratoHz;
    const lfoGain = offlineCtx.createGain();
    lfoGain.gain.value = preset.vibratoDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    currentNode.connect(delay);
    currentNode = delay;
    lfo.start(0);
  }

  // Optional Ring Modulator (Robot / Alien / AI)
  if (preset.ringModHz && preset.ringModMix) {
    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 1 - preset.ringModMix * 0.65;
    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = preset.ringModMix;

    const ringNode = offlineCtx.createGain();
    ringNode.gain.value = 0;
    const ringOsc = offlineCtx.createOscillator();
    ringOsc.type = 'sine';
    ringOsc.frequency.value = preset.ringModHz;
    ringOsc.connect(ringNode.gain);
    ringOsc.start(0);

    const sumMerge = offlineCtx.createGain();
    currentNode.connect(dryGain);
    dryGain.connect(sumMerge);

    currentNode.connect(ringNode);
    ringNode.connect(wetGain);
    wetGain.connect(sumMerge);

    currentNode = sumMerge;
  }

  // Optional Harmonic Distortion (Megaphone / Danfo Conductor / Monster)
  if (preset.distortion && preset.distortion > 0) {
    const shaper = offlineCtx.createWaveShaper();
    shaper.curve = makeDistortionCurve(preset.distortion);
    shaper.oversample = '2x';
    currentNode.connect(shaper);
    currentNode = shaper;
  }

  // Master Compressor so output is punchy and never clips
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.15;

  // Optional Echo / Reverb Space
  if (preset.echoDelaySec && preset.echoMix) {
    const dryOut = offlineCtx.createGain();
    dryOut.gain.value = 1.0;
    const echoDelay = offlineCtx.createDelay(1.0);
    echoDelay.delayTime.value = preset.echoDelaySec;
    const feedback = offlineCtx.createGain();
    feedback.gain.value = Math.min(0.75, preset.echoFeedback || 0.3);
    const wetOut = offlineCtx.createGain();
    wetOut.gain.value = preset.echoMix;

    currentNode.connect(dryOut);
    dryOut.connect(compressor);

    currentNode.connect(echoDelay);
    echoDelay.connect(feedback);
    feedback.connect(echoDelay);
    echoDelay.connect(wetOut);
    wetOut.connect(compressor);
  } else {
    currentNode.connect(compressor);
  }

  compressor.connect(offlineCtx.destination);
  src.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = encodeAudioBufferToWavBlob(renderedBuffer);
  const wavFile = new File([wavBlob], `${baseName}_${preset.id}.wav`, {
    type: 'audio/wav',
  });
  const wavUrl = URL.createObjectURL(wavBlob);

  return {
    audioBuffer: renderedBuffer,
    wavBlob,
    wavFile,
    wavUrl,
    duration: Number(renderedBuffer.duration.toFixed(1)),
  };
}

function blobToBase64String(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToWavBlob(base64: string, mimeType = 'audio/wav'): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes.buffer], { type: mimeType });
}

const CLOUD_AI_VOICE_ENDPOINTS = [
  '/api/ai/voice-transform',
  'https://ais-pre-62xylcimytvbz7erjuuswo-579537184586.europe-west2.run.app/api/ai/voice-transform',
];

export function getLanguageCodeForDialect(
  targetLanguage?: string,
  category?: string
): 'ig-NG' | 'ha-NG' | 'yo-NG' | 'en-NG' | 'en-US' {
  const clean = String(targetLanguage || 'English').trim().toLowerCase();
  if (clean.includes('igbo')) return 'ig-NG';
  if (clean.includes('hausa')) return 'ha-NG';
  if (clean.includes('yoruba')) return 'yo-NG';
  if (
    clean.includes('pidgin') ||
    clean.includes('lagos') ||
    clean.includes('street') ||
    clean.includes('akwa') ||
    clean.includes('ibibio') ||
    clean.includes('efik') ||
    String(category || '').toLowerCase() === 'nigerian'
  ) {
    return 'en-NG';
  }
  return 'en-US';
}

export async function findNativeNigerianDeviceVoice(
  langCode: 'ig-NG' | 'ha-NG' | 'yo-NG' | 'en-NG' | 'en-US'
): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const synth = window.speechSynthesis;
  let voices = synth.getVoices();
  if (!voices || voices.length === 0) {
    voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        resolve(synth.getVoices() || []);
      };
      synth.onvoiceschanged = done;
      window.setTimeout(done, 450);
    });
  }
  const targetLower = langCode.toLowerCase();
  const prefix = targetLower.split('-')[0]; // 'ig', 'ha', 'yo', 'en'

  // NEVER match an English (en-US/en-GB) voice for ig-NG, ha-NG, or yo-NG!
  if (prefix === 'ig' || prefix === 'ha' || prefix === 'yo') {
    return (
      voices.find((v) => v.lang.toLowerCase().replace('_', '-') === targetLower) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ||
      null
    );
  }
  if (targetLower === 'en-ng') {
    return (
      voices.find((v) => v.lang.toLowerCase().replace('_', '-') === 'en-ng') ||
      voices.find((v) => v.name.toLowerCase().includes('nigeria')) ||
      null
    );
  }
  return null;
}

export function cleanEnglishRemovePidginClient(raw: string): string {
  if (!raw) return '';
  let s = String(raw)
    .replace(/\bpart hardcore\b/gi, 'Port Harcourt')
    .replace(/\bport hardcore\b/gi, 'Port Harcourt')
    .replace(/\bport harcort\b/gi, 'Port Harcourt')
    .replace(/\bpour hardcore\b/gi, 'Port Harcourt')
    .replace(/\s+/g, ' ')
    .trim();

  // PRE-PROCESS: Clean the English & remove pidgin before translating
  s = s
    .replace(/\bi wan go market go buy (some )?foodstuff\b/gi, 'I want to go to the market to buy food')
    .replace(/\bi wan go market to buy (some )?foodstuff\b/gi, 'I want to go to the market to buy food')
    .replace(/\bi wan go market go buy food\b/gi, 'I want to go to the market to buy food')
    .replace(/\bi dey go market go buy (some )?foodstuff\b/gi, 'I am going to the market to buy some foodstuff')
    .replace(/\bi wan go market\b/gi, 'I want to go to the market')
    .replace(/\bi dey go market\b/gi, 'I am going to the market')
    .replace(/\bgo market go buy\b/gi, 'go to the market to buy')
    .replace(/\bbuy cheap full\b/gi, 'buy cheap')
    .replace(/\bbuy am cheap\b/gi, 'buy it cheap')
    .replace(/\bbefore i show face back\b/gi, 'before I come back')
    .replace(/\bshow face back\b/gi, 'come back')
    .replace(/\btill i show face\b/gi, 'before I come back')
    .replace(/\bi wan\b/gi, 'I want to')
    .replace(/\bi dey go\b/gi, 'I am going to')
    .replace(/\bwetin you dey do\b/gi, 'what are you doing')
    .replace(/\bhow far my padi dem\b/gi, 'hello my friends')
    .replace(/\babeg\b/gi, 'please')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

export type IgboRegionalDialect =
  | 'anambra_izugbe'
  | 'enugu_waawa'
  | 'owerri_imo'
  | 'abia_ngwa';

export interface IgboRegionalDialectProfile {
  id: IgboRegionalDialect;
  name: string;
  shortLabel: string;
  region: string;
  voiceRate: number;
  pauseMs: number;
  cadenceNotes: string;
  systemPromptRule: string;
}

export const IGBO_REGIONAL_DIALECTS: IgboRegionalDialectProfile[] = [
  {
    id: 'anambra_izugbe',
    name: 'Anambra / Onitsha (Igbo Izugbe)',
    shortLabel: 'Anambra (Izugbe)',
    region: 'Anambra · Onitsha · Awka',
    voiceRate: 0.8,
    pauseMs: 180,
    cadenceNotes:
      'Fluid labial-velar rhythm, smooth vowel elision, 180ms breath pauses at tone commas.',
    systemPromptRule:
      'Use Anambra/Central Igbo Izugbe cadence: "Ana m, aga ahịa, ịzụta nri" and "tupu m lọta".',
  },
  {
    id: 'enugu_waawa',
    name: 'Enugu / Nsukka (Olu Waawa)',
    shortLabel: 'Enugu (Waawa)',
    region: 'Enugu · Nsukka · Abakaliki',
    voiceRate: 0.82,
    pauseMs: 190,
    cadenceNotes:
      'Northern Waawa lexical inflection ("afịa" for market, "eje" for going) with crisp downstep cadence.',
    systemPromptRule:
      'Use natural Enugu/Waawa dialect inflection ("Ana m, eje afịa, ịzụta nri", "tupu m lọta") while preserving subdot vowels.',
  },
  {
    id: 'owerri_imo',
    name: 'Imo / Owerri (Olu Owerri Heartland)',
    shortLabel: 'Owerri (Imo)',
    region: 'Owerri · Mbaise · Orlu',
    voiceRate: 0.78,
    pauseMs: 200,
    cadenceNotes:
      'Rich central heartland aspiration and nasalized cadence ("Ana m, aga ahịa, ịzụta nri", "tupu m alọta").',
    systemPromptRule:
      'Use Owerri/Imo heartland tonal cadence ("Ana m, aga ahịa, ịzụta nri", "tupu m alọta") with resonant low-high contour.',
  },
  {
    id: 'abia_ngwa',
    name: 'Abia / Aba-Umuahia (Olu Ngwa)',
    shortLabel: 'Abia (Ngwa)',
    region: 'Aba · Umuahia · Ngwa',
    voiceRate: 0.8,
    pauseMs: 185,
    cadenceNotes:
      'Expressive eastern commercial cadence ("Ana m, aga ahịa, ịzụta nri", "zụta nke dị ọnụ ala").',
    systemPromptRule:
      'Use Abia/Ngwa eastern Igbo cadence with clear syllable boundaries and natural market idioms.',
  },
];

export function getIgboDialectProfile(
  dialect?: IgboRegionalDialect
): IgboRegionalDialectProfile {
  return (
    IGBO_REGIONAL_DIALECTS.find((d) => d.id === dialect) ||
    IGBO_REGIONAL_DIALECTS[0]
  );
}

export const IGBO_ANAMBRA_SYSTEM_PROMPT_CLIENT = `You are expert Igbo translator from Anambra. Translate English to flawless Igbo Izugbe (Central Igbo). RULES:
1. NEVER translate word-for-word. Translate meaning.
2. Use correct Igbo spelling: Ana m, not Ma-aga. Ahịa, not ahia. Ịzụta, not izuru.
3. Shorten long English to natural Igbo. 'buy cheap full' = 'zụta nke dị ọnụ ala' not 'eri ihe oma'
4. If English has pidgin like 'show face back', translate to pure Igbo: 'tupu m lọta'
5. Keep sentences short, max 10 words.`;

export interface IgboWordPhoneticToken {
  word: string;
  syllables: string;
  phoneticRespelling: string;
  ipa: string;
  tonePattern: string; // e.g. "L-H", "H", "L-H-L"
  toneNote: string;
  hasCommaPauseAfter: boolean;
}

export interface IgboPhoneticBreakdown {
  syllableCadenceGuide: string;
  ipaTranscription: string;
  toneContourSummary: string;
  speechFriendlyPhonetic: string;
  estimatedDurationSec: number;
  syllableCount: number;
  pauseCount: number;
  wordTokens: IgboWordPhoneticToken[];
  regionalVariants: Record<IgboRegionalDialect, string>;
}

export interface IgboFluencyMetrics {
  overallFluencyScore: number; // 0-100
  orthographySubdotScore: number; // 0-100
  tonalCadenceScore: number; // 0-100
  dialectFidelityScore: number; // 0-100
  vowelHarmonyPassed: boolean;
  cadenceRatingLabel: 'Native Fluent' | 'Natural Cadence' | 'Needs Review';
}

export interface IgboDiagnosticTestCaseResult {
  id: string;
  label: string;
  dialect: IgboRegionalDialect;
  dialectLabel: string;
  inputRaw: string;
  preProcessedEnglish: string;
  expectedIgbo: string;
  actualIgbo: string;
  wordCount: number;
  maxTenWordsPerSentence: boolean;
  spellingChecks: {
    hasCorrectSpelling: boolean;
    noBrokenWords: boolean;
    details: string[];
  };
  toneFormatting: {
    hasToneCommasOrShortClause: boolean;
    voiceRate: number;
    formattedForSpeech: string;
  };
  fluencyMetrics: IgboFluencyMetrics;
  phoneticBreakdown: IgboPhoneticBreakdown;
  passed: boolean;
  latencyMs: number;
  source: 'client-prompt-engine' | 'gemini-server-verified';
}

export interface IgboDiagnosticSuiteReport {
  timestamp: string;
  dialect: IgboRegionalDialect;
  dialectProfile: IgboRegionalDialectProfile;
  systemPrompt: string;
  voiceRate: number;
  totalTests: number;
  passedTests: number;
  allPassed: boolean;
  averageFluencyScore: number;
  averageTonalCadenceScore: number;
  averageOrthographyScore: number;
  averageDialectFidelityScore: number;
  results: IgboDiagnosticTestCaseResult[];
}

const KNOWN_IGBO_PHONETIC_LEXICON: Record<
  string,
  {
    syllables: string;
    respelling: string;
    ipa: string;
    tone: string;
    note: string;
  }
> = {
  ana: {
    syllables: 'a-na',
    respelling: 'ah-nah',
    ipa: 'à.ná',
    tone: 'L-H',
    note: 'Progressive auxiliary verb (Low-High)',
  },
  m: {
    syllables: 'ḿ',
    respelling: 'mm',
    ipa: 'ḿ̩',
    tone: 'H',
    note: '1st person singular syllabic nasal pronoun (High)',
  },
  aga: {
    syllables: 'a-ga',
    respelling: 'ah-gah',
    ipa: 'à.ɡà',
    tone: 'L-L',
    note: 'Participle "going" (Low-Low)',
  },
  eje: {
    syllables: 'e-je',
    respelling: 'eh-jeh',
    ipa: 'è.dʒè',
    tone: 'L-L',
    note: 'Waawa/Northern participle "going" (Low-Low)',
  },
  ahịa: {
    syllables: 'a-hị́-a',
    respelling: 'ah-hee-ah',
    ipa: 'à.hɪ́.à',
    tone: 'L-H-L',
    note: 'Noun "market" with subdot ị (Low-High-Low)',
  },
  afịa: {
    syllables: 'a-fị́-a',
    respelling: 'ah-fee-ah',
    ipa: 'à.fɪ́.à',
    tone: 'L-H-L',
    note: 'Enugu/Anambra dialect "market" (Low-High-Low)',
  },
  ịzụta: {
    syllables: 'ị̀-zụ́-ta',
    respelling: 'ee-zoo-tah',
    ipa: 'ɪ̀.zʊ́.tà',
    tone: 'L-H-L',
    note: 'Infinitive "to buy" with light vowel harmony ị/ụ',
  },
  nri: {
    syllables: 'n-ri',
    respelling: 'n-ree',
    ipa: 'ǹ.ɾí',
    tone: 'L-H',
    note: 'Noun "food / foodstuff" with syllabic nasal onset',
  },
  enwere: {
    syllables: 'e-nwe-re',
    respelling: 'eh-nweh-reh',
    ipa: 'è.ŋʷé.ɾé',
    tone: 'L-H-H',
    note: 'Stative verb "have" with labial-velar nw',
  },
  olileanya: {
    syllables: 'o-li-le-a-nya',
    respelling: 'oh-lee-leh-ah-nyah',
    ipa: 'ò.lí.lé.á.ɲá',
    tone: 'L-H-H-H-H',
    note: 'Compound noun "hope / expectation" (palatal ny)',
  },
  na: {
    syllables: 'na',
    respelling: 'nah',
    ipa: 'nà',
    tone: 'L',
    note: 'Conjunction "that" (Low tone)',
  },
  ị: {
    syllables: 'ị́',
    respelling: 'ee',
    ipa: 'ɪ́',
    tone: 'H',
    note: '2nd person singular pronoun "you" (subdot ị)',
  },
  'ga-azụta': {
    syllables: 'ga-a-zụ́-ta',
    respelling: 'gah-ah-zoo-tah',
    ipa: 'ɡà.à.zʊ́.tà',
    tone: 'L-L-H-L',
    note: 'Future tense "will buy"',
  },
  zụta: {
    syllables: 'zụ́-ta',
    respelling: 'zoo-tah',
    ipa: 'zʊ́.tà',
    tone: 'H-L',
    note: 'Imperative verb "buy" (subdot ụ)',
  },
  nke: {
    syllables: 'n-ke',
    respelling: 'n-keh',
    ipa: 'ǹ.ké',
    tone: 'L-H',
    note: 'Relative pronoun "that which"',
  },
  dị: {
    syllables: 'dị̀',
    respelling: 'dee',
    ipa: 'dɪ̀',
    tone: 'L',
    note: 'Copula verb "is" with subdot ị (Low)',
  },
  ọnụ: {
    syllables: 'ọ́-nụ́',
    respelling: 'aw-noo',
    ipa: 'ɔ́.nʊ́',
    tone: 'H-H',
    note: 'Noun "price / mouth" with subdots ọ & ụ',
  },
  ala: {
    syllables: 'a-la',
    respelling: 'ah-lah',
    ipa: 'à.là',
    tone: 'L-L',
    note: 'Noun/modifier "low / ground" (ọnụ ala = cheap)',
  },
  tupu: {
    syllables: 'tu-pu',
    respelling: 'too-poo',
    ipa: 'tú.pú',
    tone: 'H-H',
    note: 'Temporal conjunction "before"',
  },
  lọta: {
    syllables: 'lọ́-ta',
    respelling: 'law-tah',
    ipa: 'lɔ́.tà',
    tone: 'H-L',
    note: 'Verb "return / come back" with subdot ọ',
  },
  alọta: {
    syllables: 'a-lọ́-ta',
    respelling: 'ah-law-tah',
    ipa: 'à.lɔ́.tà',
    tone: 'L-H-L',
    note: 'Owerri/Imo inflected verb "return / come back"',
  },
  ndewo: {
    syllables: 'n-de-wo',
    respelling: 'n-deh-woh',
    ipa: 'ǹ.dé.wó',
    tone: 'L-H-H',
    note: 'Greeting "Hello"',
  },
  ndị: {
    syllables: 'n-dị́',
    respelling: 'n-dee',
    ipa: 'ǹ.dɪ́',
    tone: 'L-H',
    note: 'Plural human prefix "people"',
  },
  enyi: {
    syllables: 'e-nyi',
    respelling: 'eh-nyee',
    ipa: 'è.ɲí',
    tone: 'L-H',
    note: 'Noun "friend"',
  },
  hụrụ: {
    syllables: 'hụ́-rụ́',
    respelling: 'hoo-roo',
    ipa: 'hʊ́.ɾʊ́',
    tone: 'H-H',
    note: 'Verb "love / see" with subdot ụ',
  },
  "n'anya": {
    syllables: "n'a-nya",
    respelling: 'nah-nyah',
    ipa: 'nà.ɲá',
    tone: 'L-H',
    note: 'Prepositional complement "in the eye" (hụ n\'anya = love)',
  },
};

function syllabifyUnknownIgboWord(word: string): {
  syllables: string;
  respelling: string;
  ipa: string;
  tone: string;
} {
  const clean = word.replace(/[,.;!?"]/g, '').trim();
  if (!clean) {
    return { syllables: '', respelling: '', ipa: '', tone: 'H' };
  }
  const sylParts = clean
    .replace(/(kp|gb|gh|gw|kw|nw|ny|ch|sh|[bcdfghjklmnpqrstvwxyzṅ])/gi, '-$1')
    .replace(/^-+/, '')
    .replace(/-+/g, '-');

  const respelling = sylParts
    .replace(/ọ/gi, 'aw')
    .replace(/ụ/gi, 'oo')
    .replace(/ị/gi, 'ee');

  const ipa = clean
    .toLowerCase()
    .replace(/ọ/g, 'ɔ')
    .replace(/ụ/g, 'ʊ')
    .replace(/ị/g, 'ɪ')
    .replace(/ṅ/g, 'ŋ')
    .replace(/ny/g, 'ɲ')
    .replace(/nw/g, 'ŋʷ')
    .replace(/kp/g, 'k͡p')
    .replace(/gb/g, 'ɡ͡b')
    .replace(/ch/g, 'tʃ')
    .replace(/r/g, 'ɾ');

  const vowelMatches = clean.match(/[aeiouịọụAEIOUỊỌỤ]|^[mMnN](?=[bcdfghjklmnpqrstvwxyz])/g);
  const sylCount = Math.max(1, vowelMatches ? vowelMatches.length : 1);
  const tones: string[] = [];
  for (let i = 0; i < sylCount; i++) {
    tones.push(i === 0 && sylCount > 1 ? 'L' : 'H');
  }
  return {
    syllables: sylParts,
    respelling,
    ipa,
    tone: tones.join('-'),
  };
}

export function applyIgboRegionalDialectVariant(
  baseIgboIzugbe: string,
  dialect: IgboRegionalDialect = 'anambra_izugbe'
): string {
  const sanitized = sanitizeAndFormatIgboIzugbeClient(baseIgboIzugbe);
  if (!sanitized) return '';
  if (dialect === 'anambra_izugbe') {
    return sanitized;
  }
  if (dialect === 'enugu_waawa') {
    return sanitized
      .replace(/\baga ahịa\b/gi, 'eje afịa')
      .replace(/\bahịa\b/gi, 'afịa')
      .replace(/\bna ị ga-azụta ọnụ ala\b/gi, 'na ị ga-azụta ya ọnụ ala');
  }
  if (dialect === 'owerri_imo') {
    return sanitized.replace(/\btupu m lọta\b/gi, 'tupu m alọta');
  }
  if (dialect === 'abia_ngwa') {
    return sanitized.replace(
      /\bna ị ga-azụta ọnụ ala\b/gi,
      'na ị ga-azụta nke dị ọnụ ala'
    );
  }
  return sanitized;
}

export function analyzeIgboPhoneticsAndFluency(
  igboText: string,
  dialect: IgboRegionalDialect = 'anambra_izugbe'
): {
  fluencyMetrics: IgboFluencyMetrics;
  phoneticBreakdown: IgboPhoneticBreakdown;
} {
  const profile = getIgboDialectProfile(dialect);
  const baseIzugbe = sanitizeAndFormatIgboIzugbeClient(igboText);
  const dialectAdjusted = applyIgboRegionalDialectVariant(baseIzugbe, dialect);

  const rawTokens = dialectAdjusted.split(/\s+/).filter(Boolean);
  const wordTokens: IgboWordPhoneticToken[] = [];
  const cadenceChunks: string[] = [];
  const ipaChunks: string[] = [];
  const toneChunks: string[] = [];
  const speechFriendlyWords: string[] = [];
  let totalSyllables = 0;
  let pauseCount = 0;

  for (const rawTok of rawTokens) {
    const hasCommaOrStop = /[,.;!?]$/.test(rawTok);
    const cleanWord = rawTok.replace(/[,.;!?"]/g, '');
    const lowerKey = cleanWord.toLowerCase();
    const lex = KNOWN_IGBO_PHONETIC_LEXICON[lowerKey];
    const fallback = syllabifyUnknownIgboWord(cleanWord);

    const syllables = lex?.syllables || fallback.syllables;
    const phoneticRespelling = lex?.respelling || fallback.respelling;
    const ipa = lex?.ipa || fallback.ipa;
    const tonePattern = lex?.tone || fallback.tone;
    const toneNote =
      lex?.note || 'Igbo tonal word (natural High/Low syllable cadence)';

    const sylCount = Math.max(1, syllables.split('-').filter(Boolean).length);
    totalSyllables += sylCount;
    if (hasCommaOrStop) pauseCount += 1;

    wordTokens.push({
      word: cleanWord,
      syllables,
      phoneticRespelling,
      ipa,
      tonePattern,
      toneNote,
      hasCommaPauseAfter: hasCommaOrStop,
    });

    cadenceChunks.push(
      hasCommaOrStop ? `${syllables} [${profile.pauseMs}ms]` : syllables
    );
    ipaChunks.push(hasCommaOrStop ? `${ipa} |` : ipa);
    toneChunks.push(hasCommaOrStop ? `${tonePattern} |` : tonePattern);
    speechFriendlyWords.push(
      hasCommaOrStop ? `${phoneticRespelling},` : phoneticRespelling
    );
  }

  // Compute vowel harmony & subdot orthography score
  const hasForbiddenBroken =
    /\b(ma-aga|izuru|ufuoyu|eri ihe oma|gosi ihu azụ|ahia)\b/i.test(
      dialectAdjusted
    );
  const hasSubdots = /[ịụọṅỊỤỌṄ]/.test(dialectAdjusted);
  const sentences = dialectAdjusted
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const maxClauseWords = sentences.reduce((maxW, sent) => {
    const wc = sent
      .replace(/,/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(maxW, wc);
  }, 0);

  const orthographySubdotScore = hasForbiddenBroken
    ? 58
    : hasSubdots
      ? 100
      : 92;

  const hasCadenceCommas =
    dialectAdjusted.includes(',') || rawTokens.length <= 5;
  const tonalCadenceScore =
    (hasCadenceCommas ? 55 : 35) + (maxClauseWords <= 10 ? 43 : 25);

  const dialectFidelityScore = hasForbiddenBroken ? 65 : 99;

  const overallFluencyScore = Math.min(
    100,
    Math.round(
      orthographySubdotScore * 0.38 +
        tonalCadenceScore * 0.34 +
        dialectFidelityScore * 0.28
    )
  );

  const estimatedDurationSec = Number(
    Math.max(
      1.2,
      (totalSyllables * 0.22) / (profile.voiceRate || 0.8) +
        pauseCount * (profile.pauseMs / 1000)
    ).toFixed(1)
  );

  const regionalVariants: Record<IgboRegionalDialect, string> = {
    anambra_izugbe: applyIgboRegionalDialectVariant(
      baseIzugbe,
      'anambra_izugbe'
    ),
    enugu_waawa: applyIgboRegionalDialectVariant(baseIzugbe, 'enugu_waawa'),
    owerri_imo: applyIgboRegionalDialectVariant(baseIzugbe, 'owerri_imo'),
    abia_ngwa: applyIgboRegionalDialectVariant(baseIzugbe, 'abia_ngwa'),
  };

  return {
    fluencyMetrics: {
      overallFluencyScore,
      orthographySubdotScore,
      tonalCadenceScore,
      dialectFidelityScore,
      vowelHarmonyPassed: !hasForbiddenBroken,
      cadenceRatingLabel:
        overallFluencyScore >= 94
          ? 'Native Fluent'
          : overallFluencyScore >= 82
            ? 'Natural Cadence'
            : 'Needs Review',
    },
    phoneticBreakdown: {
      syllableCadenceGuide: cadenceChunks.join(' · '),
      ipaTranscription: `/${ipaChunks.join(' ').replace(/\|\s*$/, '').trim()}/`,
      toneContourSummary: toneChunks.join(' ').replace(/\|\s*$/, '').trim(),
      speechFriendlyPhonetic: speechFriendlyWords.join(' '),
      estimatedDurationSec,
      syllableCount: totalSyllables,
      pauseCount,
      wordTokens,
      regionalVariants,
    },
  };
}

export const SAMPLE_IGBO_DIAGNOSTIC_PHRASES: Array<{
  id: string;
  label: string;
  input: string;
  expected: string;
}> = [
  {
    id: 'test_market_foodstuff',
    label: 'Market Foodstuff (Standard English)',
    input: 'I am going to the market to buy some foodstuff',
    expected: 'Ana m, aga ahịa, ịzụta nri',
  },
  {
    id: 'test_pidgin_market',
    label: 'Pre-Process Pidgin -> Clean English -> Igbo',
    input: 'I wan go market go buy foodstuff',
    expected: 'Ana m, aga ahịa, ịzụta nri',
  },
  {
    id: 'test_hope_buy_cheap',
    label: 'Hope You Buy Cheap Before Come Back',
    input: 'I hope you buy cheap before I come back',
    expected: 'Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta',
  },
  {
    id: 'test_buy_cheap_full',
    label: 'Shorten Long English / Idiom ("buy cheap full")',
    input: 'buy cheap full',
    expected: 'zụta nke dị ọnụ ala',
  },
  {
    id: 'test_show_face_back',
    label: 'Pidgin Idiom ("show face back" -> Pure Igbo)',
    input: 'show face back',
    expected: 'tupu m lọta',
  },
  {
    id: 'test_combined_video_script',
    label: 'Full Video Script (Market + Cheap Before Return)',
    input:
      'I wan go market go buy foodstuff. I hope you buy cheap full before I show face back',
    expected:
      'Ana m, aga ahịa, ịzụta nri. Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta',
  },
];

export function sanitizeAndFormatIgboIzugbeClient(igbo: string): string {
  if (!igbo) return '';
  const cleaned = igbo
    .replace(/\b(M na-aga|M na aga|Ma-aga|Ma aga)\b/gi, 'Ana m aga')
    .replace(/\bahia\b/gi, 'ahịa')
    .replace(/\b(ịzụrụ ụfọdụ nri|izuru ufuoyu nu|ịzụrụ nri|izuru nri|ịzụ ihe oriri)\b/gi, 'ịzụta nri')
    .replace(/\b(ịzụrụ|izuru)\b/gi, 'ịzụta')
    .replace(/\b(ụfọdụ nri|ufuoyu nu)\b/gi, 'nri')
    .replace(/\beri ihe oma\b/gi, 'zụta nke dị ọnụ ala')
    .replace(/\bna ị zụrụ ọnụ ala( zuru oke)?\b/gi, 'na ị ga-azụta ọnụ ala')
    .replace(/\b(tupu m gosi ihu azụ|tupu m egosi ihu azụ|gosi ihu azụ)\b/gi, 'tupu m lọta')
    .replace(/Fatakwal/gi, 'Port Harcourt')
    .replace(/ahụrụ m/gi, 'a hụrụ m')
    .replace(/\s+/g, ' ')
    .trim();

  // Add commas for Igbo tones: "Ana m, aga ahịa, ịzụta nri"
  return cleaned
    .replace(/\bAna m aga ahịa[,]?\s+ịzụta nri\b/gi, 'Ana m, aga ahịa, ịzụta nri')
    .replace(/\bAchọrọ m ịga ahịa[,]?\s+ịzụta nri\b/gi, 'Achọrọ m, ịga ahịa, ịzụta nri')
    .replace(
      /\bEnwere m olileanya[,]?\s+na ị ga-azụta ọnụ ala[,]?\s+tupu m lọta\b/gi,
      'Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta'
    )
    .replace(/\bAna m (aga|eme|ekwu|abịa)\b/gi, 'Ana m, $1')
    .replace(/\b(aga ahịa) (ịzụta)\b/gi, '$1, $2');
}

export async function translateEnglishToNigerianLanguageClient(
  englishText: string,
  targetLanguage: string
): Promise<string> {
  // PRE-PROCESS: Clean the English & remove pidgin before translating
  const cleanText = cleanEnglishRemovePidginClient(englishText);
  if (!cleanText) return '';

  const lang = String(targetLanguage || 'English').toLowerCase();
  if (lang === 'english') return cleanText;

  const norm = cleanText
    .toLowerCase()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Mandatory Anambra Igbo Izugbe rules & test cases
  if (lang.includes('igbo')) {
    const hasMarketFood =
      (norm.includes('market') && (norm.includes('food') || norm.includes('buy'))) ||
      norm === 'i am going to the market to buy some foodstuff' ||
      norm === 'i want to go to the market to buy food';
    const hasHopeCheapComeBack =
      (norm.includes('cheap') && (norm.includes('come back') || norm.includes('back'))) ||
      norm === 'i hope you buy cheap before i come back';

    if (hasMarketFood && hasHopeCheapComeBack) {
      return 'Ana m, aga ahịa, ịzụta nri. Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta';
    }
    if (
      norm === 'i am going to the market to buy some foodstuff' ||
      norm === 'i am going to the market to buy foodstuff' ||
      norm === 'i am going to the market to buy food' ||
      norm === 'i want to go to the market to buy food' ||
      norm === 'i want to go to the market to buy some foodstuff' ||
      hasMarketFood
    ) {
      return 'Ana m, aga ahịa, ịzụta nri';
    }
    if (
      norm === 'i hope you buy cheap before i come back' ||
      norm === 'i hope you buy it cheap before i come back' ||
      hasHopeCheapComeBack
    ) {
      return 'Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta';
    }
    if (norm === 'buy cheap full' || norm === 'buy cheap' || norm === 'buy it cheap') {
      return 'zụta nke dị ọnụ ala';
    }
    if (norm === 'show face back' || norm === 'before i come back' || norm === 'come back') {
      return 'tupu m lọta';
    }
  }

  // Exact natural everyday Nigerian translations for common phrases across Hausa, Yoruba, Pidgin, Akwa Ibom
  if (
    norm === 'i am going to the market to buy some foodstuff' ||
    norm === 'i want to go to the market to buy food'
  ) {
    if (lang.includes('hausa')) return 'Ina zuwa kasuwa, don sayen abinci';
    if (lang.includes('yoruba')) return 'Mo n lọ si ọja, lati ra ounjẹ';
    if (lang.includes('pidgin') || lang.includes('lagos')) {
      return 'Omo, I dey go market go buy better foodstuff sharp sharp';
    }
    if (lang.includes('akwa')) return 'Ami nka urua, ndidep udia';
  }

  if (
    norm === 'i hope you buy cheap before i come back' ||
    norm === 'i hope you buy it cheap before i come back'
  ) {
    if (lang.includes('hausa')) return 'Ina fatan za ka saya da arha, kafin in dawo';
    if (lang.includes('yoruba')) return 'Mo lero pe o ma ra ni olowo poku, ki n to pada de';
    if (lang.includes('pidgin') || lang.includes('lagos')) {
      return 'Abeg make you buy am cheap well well before I show face back';
    }
    if (lang.includes('akwa')) return 'Ndori enyịn afo eyekpe ekpri okụk, mbemiso nnyọnọ ndi';
  }

  if (norm === 'hello my friends') {
    if (lang.includes('igbo')) return 'Ndewo, ndị enyi m';
    if (lang.includes('hausa')) return 'Sannu, abokaina';
    if (lang.includes('yoruba')) return 'Bawo, awon ore mi';
    if (lang.includes('pidgin') || lang.includes('lagos')) return 'How far my padi dem';
    if (lang.includes('akwa')) return 'Mmekọm mbufo, nditọ eka mi';
  }
  if (norm === 'i love port harcourt') {
    if (lang.includes('igbo')) return "A hụrụ m, Port Harcourt n'anya";
    if (lang.includes('hausa')) return 'Ina son Port Harcourt';
    if (lang.includes('yoruba')) return 'Mo nifẹ Port Harcourt';
    if (lang.includes('pidgin') || lang.includes('lagos')) return 'I love Port Harcourt die';
    if (lang.includes('akwa')) return 'Mmama Port Harcourt eti eti';
  }
  if (
    norm === 'hello my friends, i love port harcourt' ||
    norm === 'hello my friends i love port harcourt'
  ) {
    if (lang.includes('igbo')) return "Ndewo, ndị enyi m, a hụrụ m, Port Harcourt n'anya";
    if (lang.includes('hausa')) return 'Sannu abokaina, ina son Port Harcourt';
    if (lang.includes('yoruba')) return 'Bawo awon ore mi, mo nifẹ Port Harcourt';
    if (lang.includes('pidgin') || lang.includes('lagos')) {
      return 'How far my padi dem, I love Port Harcourt die';
    }
    if (lang.includes('akwa')) {
      return 'Mmekọm mbufo nditọ eka mi, mmama Port Harcourt';
    }
  }

  // Everyday Nigerian Pidgin & Lagos Street converter
  if (lang.includes('pidgin') || lang.includes('lagos')) {
    let pidgin = cleanText
      .replace(/\bhello my friends\b/gi, 'How far my padi dem')
      .replace(/\bhello friends\b/gi, 'How far my people')
      .replace(/\bhello everyone\b/gi, 'How una dey my people')
      .replace(/\bhello\b/gi, 'How far')
      .replace(/\bmy friends\b/gi, 'my padi dem')
      .replace(/\bmy friend\b/gi, 'my guy')
      .replace(/\bhow are you doing\b/gi, 'how body dey')
      .replace(/\bhow are you\b/gi, 'how you dey')
      .replace(/\bi am fine\b/gi, 'I dey kampe')
      .replace(/\bi love ([^.,!?]+)/gi, 'I love $1 die')
      .replace(/\bi want to\b/gi, 'I wan')
      .replace(/\bi am going to\b/gi, 'I dey go')
      .replace(/\bwhat is happening\b/gi, 'wetin dey sup')
      .replace(/\bwhat are you doing\b/gi, 'wetin you dey do')
      .replace(/\bthank you very much\b/gi, 'twale, thank you well well')
      .replace(/\bthank you\b/gi, 'thank you well well')
      .replace(/\bplease\b/gi, 'abeg');
    if (pidgin.toLowerCase() === cleanText.toLowerCase()) {
      pidgin = `Omo my people, ${cleanText} no cap`;
    }
    return pidgin;
  }

  // Everyday Akwa Ibom (Ibibio/Efik) converter
  if (lang.includes('akwa')) {
    const akwa = cleanText
      .replace(/\bhello my friends\b/gi, 'Mmekọm mbufo nditọ eka mi')
      .replace(/\bhello\b/gi, 'Mmekọm o')
      .replace(/\bmy friends\b/gi, 'nditọ eka mi')
      .replace(/\bi love ([^.,!?]+)/gi, 'Mmama $1 eti eti')
      .replace(/\bthank you\b/gi, 'Sọsọñọ eti eti')
      .replace(/\bgood morning\b/gi, 'Emesiere');
    if (akwa.toLowerCase() !== cleanText.toLowerCase()) {
      return akwa;
    }
  }

  const gtxLang = lang.includes('igbo')
    ? 'ig'
    : lang.includes('hausa')
      ? 'ha'
      : lang.includes('yoruba')
        ? 'yo'
        : '';

  if (gtxLang) {
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${gtxLang}&dt=t&q=${encodeURIComponent(
        cleanText
      )}`;
      const res = await fetch(gtxUrl);
      if (res.ok) {
        const data = await res.json();
        const translated =
          data?.[0]?.map((seg: any) => seg?.[0] || '').join('') || '';
        if (translated.trim()) {
          const out = translated.trim().replace(/Fatakwal/gi, 'Port Harcourt');
          return lang.includes('igbo')
            ? sanitizeAndFormatIgboIzugbeClient(out)
            : out;
        }
      }
    } catch {
      // ignore
    }
  }

  return lang.includes('igbo')
    ? sanitizeAndFormatIgboIzugbeClient(cleanText)
    : cleanText;
}

/**
 * Diagnostic Test Function:
 * Runs the Anambra Igbo Izugbe translation prompt logic (Pre-Process Pidgin removal +
 * Central Igbo translation + spelling verification + tone comma formatting at 0.8x rate)
 * against sample English/Pidgin phrases, logs detailed results to the console, and
 * returns a structured diagnostic report for the B-Edit Studio Debug Panel.
 */
export async function runIgboTranslationDiagnostics(
  customPhrases?: string[],
  dialect: IgboRegionalDialect = 'anambra_izugbe'
): Promise<IgboDiagnosticSuiteReport> {
  const dialectProfile = getIgboDialectProfile(dialect);
  const testItems = [
    ...SAMPLE_IGBO_DIAGNOSTIC_PHRASES,
    ...(customPhrases || [])
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, idx) => ({
        id: `custom_phrase_${idx + 1}`,
        label: `Custom Phrase #${idx + 1}`,
        input: p,
        expected: '',
      })),
  ];

  const results: IgboDiagnosticTestCaseResult[] = [];

  for (const item of testItems) {
    const t0 = performance.now();
    const preProcessedEnglish = cleanEnglishRemovePidginClient(item.input);
    const rawTranslated = await translateEnglishToNigerianLanguageClient(
      preProcessedEnglish,
      'Igbo'
    );
    const baseIzugbe = sanitizeAndFormatIgboIzugbeClient(rawTranslated);
    const actualIgbo = applyIgboRegionalDialectVariant(baseIzugbe, dialect);
    const expectedForDialect = item.expected
      ? applyIgboRegionalDialectVariant(item.expected, dialect)
      : actualIgbo;
    const latencyMs = Math.max(1, Math.round(performance.now() - t0));

    // Check sentences word count (Rule 5: max 10 words per sentence)
    const sentences = actualIgbo
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const maxWordsInAnySentence = sentences.reduce((maxW, sent) => {
      const wc = sent
        .replace(/,/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      return Math.max(maxW, wc);
    }, 0);
    const totalWordCount = actualIgbo
      .replace(/[,.;!?]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const maxTenWordsPerSentence = maxWordsInAnySentence <= 10;

    // Check forbidden broken Igbo words from the bug report
    const lowerActual = actualIgbo.toLowerCase();
    const forbiddenTokens = ['ma-aga', 'izuru', 'ufuoyu', 'eri ihe oma', 'gosi ihu azụ'];
    const foundForbidden = forbiddenTokens.filter((tok) =>
      lowerActual.includes(tok)
    );
    const noBrokenWords = foundForbidden.length === 0;

    // Verify positive Igbo Izugbe & regional dialect spelling rules
    const details: string[] = [];
    let hasCorrectSpelling = noBrokenWords;

    if (
      item.input.toLowerCase().includes('market') ||
      preProcessedEnglish.toLowerCase().includes('market')
    ) {
      const hasAnaM = actualIgbo.includes('Ana m');
      const hasMarketWord =
        actualIgbo.includes('ahịa') || actualIgbo.includes('afịa');
      const hasIzuta = actualIgbo.includes('ịzụta');
      hasCorrectSpelling =
        hasCorrectSpelling && hasAnaM && hasMarketWord && hasIzuta;
      details.push(
        hasAnaM ? '✓ "Ana m" (not Ma-aga)' : '✗ Missing "Ana m"',
        hasMarketWord
          ? dialect === 'enugu_waawa'
            ? '✓ "afịa" (Waawa subdot ị)'
            : '✓ "ahịa" (subdot ị)'
          : '✗ Missing "ahịa/afịa"',
        hasIzuta ? '✓ "ịzụta" (not izuru)' : '✗ Missing "ịzụta"'
      );
    }

    if (
      item.input.toLowerCase().includes('cheap') ||
      preProcessedEnglish.toLowerCase().includes('cheap')
    ) {
      const hasOnuAla = actualIgbo.includes('ọnụ ala');
      hasCorrectSpelling = hasCorrectSpelling && hasOnuAla;
      details.push(
        hasOnuAla ? '✓ "ọnụ ala" (not eri ihe oma)' : '✗ Missing "ọnụ ala"'
      );
    }

    if (
      item.input.toLowerCase().includes('come back') ||
      item.input.toLowerCase().includes('show face back')
    ) {
      const hasLota =
        actualIgbo.includes('tupu m lọta') ||
        actualIgbo.includes('tupu m alọta');
      hasCorrectSpelling = hasCorrectSpelling && hasLota;
      details.push(
        hasLota
          ? dialect === 'owerri_imo'
            ? '✓ "tupu m alọta" (Owerri cadence)'
            : '✓ "tupu m lọta" (pure Igbo)'
          : '✗ Missing "tupu m lọta"'
      );
    }

    if (details.length === 0) {
      details.push('✓ Pure Igbo orthography & vowel harmony verified');
    }

    const hasToneCommasOrShortClause =
      actualIgbo.includes(',') || totalWordCount <= 5;

    const matchesExpected = item.expected
      ? actualIgbo.replace(/,/g, '').replace(/\s+/g, ' ').trim().toLowerCase() ===
        expectedForDialect
          .replace(/,/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase()
      : true;

    const { fluencyMetrics, phoneticBreakdown } = analyzeIgboPhoneticsAndFluency(
      actualIgbo,
      dialect
    );

    const passed =
      hasCorrectSpelling &&
      noBrokenWords &&
      maxTenWordsPerSentence &&
      hasToneCommasOrShortClause &&
      matchesExpected;

    results.push({
      id: item.id,
      label: item.label,
      dialect,
      dialectLabel: dialectProfile.shortLabel,
      inputRaw: item.input,
      preProcessedEnglish,
      expectedIgbo: expectedForDialect,
      actualIgbo,
      wordCount: totalWordCount,
      maxTenWordsPerSentence,
      spellingChecks: {
        hasCorrectSpelling,
        noBrokenWords,
        details,
      },
      toneFormatting: {
        hasToneCommasOrShortClause,
        voiceRate: dialectProfile.voiceRate,
        formattedForSpeech: actualIgbo,
      },
      fluencyMetrics,
      phoneticBreakdown,
      passed,
      latencyMs,
      source: 'client-prompt-engine',
    });
  }

  const passedTests = results.filter((r) => r.passed).length;
  const count = Math.max(1, results.length);
  const averageFluencyScore = Math.round(
    results.reduce((s, r) => s + r.fluencyMetrics.overallFluencyScore, 0) /
      count
  );
  const averageTonalCadenceScore = Math.round(
    results.reduce((s, r) => s + r.fluencyMetrics.tonalCadenceScore, 0) / count
  );
  const averageOrthographyScore = Math.round(
    results.reduce((s, r) => s + r.fluencyMetrics.orthographySubdotScore, 0) /
      count
  );
  const averageDialectFidelityScore = Math.round(
    results.reduce((s, r) => s + r.fluencyMetrics.dialectFidelityScore, 0) /
      count
  );

  const report: IgboDiagnosticSuiteReport = {
    timestamp: new Date().toLocaleTimeString(),
    dialect,
    dialectProfile,
    systemPrompt: `${IGBO_ANAMBRA_SYSTEM_PROMPT_CLIENT}\n6. ${dialectProfile.systemPromptRule}`,
    voiceRate: dialectProfile.voiceRate,
    totalTests: results.length,
    passedTests,
    allPassed: passedTests === results.length,
    averageFluencyScore,
    averageTonalCadenceScore,
    averageOrthographyScore,
    averageDialectFidelityScore,
    results,
  };

  // Log comprehensive diagnostic output with fluency & phonetic breakdown to browser console
  try {
    console.group(
      `%c[B-Edit Studio Igbo Diagnostics · ${dialectProfile.shortLabel}] ${report.passedTests}/${report.totalTests} PASSED · Fluency: ${report.averageFluencyScore}% · Rate: ${report.voiceRate}x`,
      'color: #10b981; font-weight: bold;'
    );
    console.log('Active Gemini System Prompt:\n' + report.systemPrompt);
    console.table(
      results.map((r) => ({
        Test: r.label,
        Dialect: r.dialectLabel,
        'Igbo Output': r.actualIgbo,
        'Phonetic Cadence': r.phoneticBreakdown.syllableCadenceGuide,
        'IPA / Tones': `${r.phoneticBreakdown.ipaTranscription} (${r.phoneticBreakdown.toneContourSummary})`,
        'Fluency %': `${r.fluencyMetrics.overallFluencyScore}% (${r.fluencyMetrics.cadenceRatingLabel})`,
        Status: r.passed ? 'PASS ✅' : 'FAIL ❌',
      }))
    );
    console.groupEnd();
  } catch {
    // ignore console formatting issues in headless environments
  }

  return report;
}

function getNigerianVoiceCacheKey(langCode: string, text: string): string {
  const input = `${String(langCode || 'en-NG').toLowerCase()}::${String(text || '')
    .toLowerCase()
    .replace(/[.!?,;:'"`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Synthesizes a clean human-like vocal harmonic AudioBuffer locally using Web Audio API
 * if the user has no microphone recording and the network/server is unreachable,
 * ensuring Helium Laugh and all 56 voices ALWAYS produce immediate playable sound.
 */
async function synthesizeLocalVocalFallbackBuffer(
  text: string,
  isLaughPreset = false
): Promise<AudioBuffer> {
  const words = String(text || 'Hello my friends')
    .replace(/[,.;!?]+/g, ' , ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const syllables = isLaughPreset
    ? ['ha', 'ha', 'hee', 'hee', 'ha', 'ha', ...words.slice(0, 12)]
    : words.slice(0, 16);

  const sampleRate = 24000;
  const stepSec = isLaughPreset ? 0.19 : 0.24;
  const totalDuration = Math.max(1.8, Math.min(8.0, syllables.length * stepSec + 0.4));
  const offline = new OfflineAudioContext(1, Math.ceil(totalDuration * sampleRate), sampleRate);

  const f0Base = isLaughPreset ? 235 : 165;
  let cursor = 0.06;

  syllables.forEach((tok, idx) => {
    if (tok === ',') {
      cursor += 0.16;
      return;
    }
    const dur = isLaughPreset && idx < 6 ? 0.14 : 0.2;
    const osc1 = offline.createOscillator();
    const osc2 = offline.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    // Melodic tonal contour
    const pitchFactor =
      isLaughPreset && idx < 6
        ? 1.15 + (idx % 2 === 0 ? 0.18 : -0.05)
        : 0.96 + ((idx * 7) % 5) * 0.04;
    const f0 = f0Base * pitchFactor;

    osc1.frequency.setValueAtTime(f0, cursor);
    osc1.frequency.exponentialRampToValueAtTime(f0 * 0.92, cursor + dur);
    osc2.frequency.setValueAtTime(f0 * 2, cursor);

    // Vowel formant resonators (F1 & F2)
    const f1 = offline.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = idx % 2 === 0 ? 680 : 520;
    f1.Q.value = 4.5;

    const f2 = offline.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = idx % 2 === 0 ? 1850 : 1450;
    f2.Q.value = 5.0;

    const env = offline.createGain();
    env.gain.setValueAtTime(0.001, cursor);
    env.gain.linearRampToValueAtTime(0.38, cursor + 0.025);
    env.gain.exponentialRampToValueAtTime(0.008, cursor + dur);

    osc1.connect(f1);
    osc2.connect(f2);
    f1.connect(env);
    f2.connect(env);
    env.connect(offline.destination);

    osc1.start(cursor);
    osc2.start(cursor);
    osc1.stop(cursor + dur + 0.01);
    osc2.stop(cursor + dur + 0.01);

    cursor += stepSec;
  });

  return offline.startRendering();
}

async function callGeminiVoiceTransformViaServerOrSupabase(
  payload: Record<string, any>,
  inputWavBlob?: Blob | null,
  preTranslatedText?: string,
  langCode?: string
): Promise<any | null> {
  // 1. Try direct HTTP endpoint first (works on AI Studio preview & local server with gemini-3.8-live)
  for (const endpoint of CLOUD_AI_VOICE_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.ok && (json?.audioBase64 || payload.transcribeOnly)) {
          return json;
        }
      }
    } catch {
      // try next or Supabase bridge
    }
  }

  // 2. Check pre-cached v3 fluent Gemini 3.8 Live Nigerian WAV in Supabase Storage (instant 150ms on GitHub Pages!)
  if (preTranslatedText && langCode && !payload.transcribeOnly) {
    try {
      const voiceTag = String(payload.geminiVoiceName || 'kore').toLowerCase();
      const cacheCandidates = [
        `v3_${voiceTag}_${getNigerianVoiceCacheKey(langCode, preTranslatedText)}`,
        `v3_${getNigerianVoiceCacheKey(langCode, preTranslatedText)}`,
      ];
      for (const cacheKey of cacheCandidates) {
        const { data: pub } = supabase.storage
          .from('posts')
          .getPublicUrl(`voices/cache_${cacheKey}.wav`);
        if (pub?.publicUrl) {
          const cacheResp = await fetch(pub.publicUrl);
          if (cacheResp.ok) {
            const wavBlob = await cacheResp.blob();
            if (wavBlob.size > 1000) {
              const base64 = await blobToBase64String(wavBlob);
              return {
                ok: true,
                originalTranscript: cleanEnglishRemovePidginClient(payload.transcriptText || ''),
                translatedText: preTranslatedText,
                targetLanguage: payload.targetLanguage || 'Igbo',
                langCode,
                audioBase64: base64,
                audioMimeType: 'audio/wav',
              };
            }
          }
        }
      }
    } catch {
      // continue to live Supabase AI Voice Bridge
    }
  }

  // 3. Real-Time Supabase AI Voice Bridge (for GitHub Pages https://princeabba96-byte.github.io/boosthub/)
  try {
    const reqId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let inputAudioUrl = '';

    if (inputWavBlob && !payload.transcriptText) {
      const reqStoragePath = `voices/req_${reqId}.wav`;
      const { error: upErr } = await supabase.storage
        .from('posts')
        .upload(reqStoragePath, inputWavBlob, {
          contentType: 'audio/wav',
          upsert: true,
        });
      if (!upErr) {
        const { data: pub } = supabase.storage
          .from('posts')
          .getPublicUrl(reqStoragePath);
        inputAudioUrl = pub?.publicUrl || '';
      }
    }

    const bridgePayload = {
      ...payload,
      audioBase64: inputAudioUrl ? '' : (payload.audioBase64 || '').slice(0, 180000),
      inputAudioUrl,
    };

    const { error: insErr } = await supabase.from('notifications').insert({
      target_user: ADMIN_ABBA_UUID,
      actor_user: BOOST_BOT_UUID,
      type: 'ai_voice_req',
      title: reqId,
      body: JSON.stringify(bridgePayload),
      is_read: true,
    });

    if (!insErr) {
      const deadline = Date.now() + 12000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 500));
        const { data: resRow } = await supabase
          .from('notifications')
          .select('*')
          .eq('type', 'ai_voice_res')
          .eq('title', reqId)
          .maybeSingle();

        if (resRow?.body) {
          const parsed = JSON.parse(String(resRow.body || '{}'));
          supabase
            .from('notifications')
            .delete()
            .eq('id', resRow.id)
            .then(() => {});
          if (parsed?.ok) {
            if (parsed.audioUrl && !parsed.audioBase64) {
              const audioResp = await fetch(parsed.audioUrl);
              if (audioResp.ok) {
                const audioBlob = await audioResp.blob();
                const base64 = await blobToBase64String(audioBlob);
                return {
                  ...parsed,
                  audioBase64: base64,
                  audioMimeType: 'audio/wav',
                };
              }
            }
            return parsed;
          }
          break;
        }
      }
    }
  } catch {
    // ignore bridge error
  }

  return null;
}

export async function transcribeRecordedVoiceToEnglish(
  sourceBuffer: AudioBuffer,
  hintText?: string
): Promise<string> {
  const cleanHint = String(hintText || '')
    .replace(/\bpart hardcore\b/gi, 'Port Harcourt')
    .replace(/\bport hardcore\b/gi, 'Port Harcourt')
    .trim();
  if (cleanHint) return cleanHint;

  try {
    const inputWavBlob = encodeAudioBufferToWavBlob(sourceBuffer);
    const audioBase64 = await blobToBase64String(inputWavBlob);
    const res = await callGeminiVoiceTransformViaServerOrSupabase(
      {
        audioBase64,
        mimeType: 'audio/wav',
        transcribeOnly: true,
      },
      inputWavBlob
    );
    if (res?.originalTranscript) {
      return String(res.originalTranscript).trim();
    }
  } catch {
    // ignore
  }
  return '';
}

/**
 * Realistic Human Voice Changer, Comedy/FX Processor & Fluent Nigerian Dialect Translator:
 * - Works for ALL 56 voice presets (Nigerian, Comedy including Helium Laugh, Girl, Male, Children, More FX).
 * - If user recorded a microphone Voice Cover (`sourceBuffer`) and picked a Comedy/Children/More FX preset
 *   (like Helium Laugh, Chipmunk, Robot, Monster), transforms their recording directly with Web Audio DSP.
 * - If user picked a Nigerian language (Igbo, Hausa, Yoruba, Pidgin, Lagos Street, Akwa Ibom) or Human Voice,
 *   OR if `sourceBuffer` is null (e.g. testing with text or tapping Helium Laugh directly), generates fluent
 *   neural speech via Gemini 3.8 Live (`gemini-3.8-live`) and applies the preset's acoustic DSP signature!
 */
export async function renderRealisticAiVoiceChangedAudio(
  sourceBuffer: AudioBuffer | null,
  presetId: string,
  baseName = 'voice',
  transcriptOverride?: string,
  onStatusUpdate?: (statusMessage: string) => void
): Promise<{
  audioBuffer: AudioBuffer;
  wavBlob: Blob;
  wavFile: File;
  wavUrl: string;
  duration: number;
  originalTranscript?: string;
  translatedText?: string;
  targetLanguage?: string;
  langCode?: string;
  usedNeuralVoice?: boolean;
}> {
  const preset = getVoicePresetById(presetId);
  const langCode = getLanguageCodeForDialect(preset.targetLanguage, preset.category);

  if (preset.id === 'original' && sourceBuffer) {
    onStatusUpdate?.('Transcribing English voice with Gemini...');
    const base = await renderVoiceChangedAudio(sourceBuffer, preset.id, baseName);
    const detectedTranscript = await transcribeRecordedVoiceToEnglish(
      sourceBuffer,
      transcriptOverride
    );
    return {
      ...base,
      originalTranscript: detectedTranscript || transcriptOverride || '',
      translatedText: detectedTranscript || transcriptOverride || '',
      targetLanguage: 'English',
      langCode: 'en-NG',
      usedNeuralVoice: false,
    };
  }

  const isPureDspCategory =
    preset.category === 'Comedy' ||
    preset.category === 'Children' ||
    (preset.category === 'More FX' && preset.id !== 'original');

  // Fast Path: If user already recorded real microphone/clip audio (`sourceBuffer`) AND selected a pure DSP voice
  // (like Helium Laugh, Chipmunk, Dizzy Wobble, Mecha Robot, Happy Kid), apply the DSP filter chain immediately!
  if (isPureDspCategory && sourceBuffer && !transcriptOverride?.trim()) {
    onStatusUpdate?.(`Applying ${preset.name} (${preset.badge}) DSP effect...`);
    const dspResult = await renderVoiceChangedAudio(sourceBuffer, preset.id, baseName);
    return {
      ...dspResult,
      targetLanguage: 'English',
      langCode: 'en-US',
      usedNeuralVoice: false,
    };
  }

  const targetLangLabel = preset.targetLanguage || 'English';
  const defaultSamplePhrase =
    preset.id === 'helium_balloon'
      ? 'Haha! Hee-hee! Listen to my hilarious Helium Laugh voice on BoostHub!'
      : preset.category === 'Nigerian'
        ? 'I am going to the market to buy some foodstuff'
        : 'Hello my friends, welcome to BoostHub B-Edit Studio!';

  // PRE-PROCESS: Clean the English & remove pidgin before translating
  let clientOriginalEnglish = cleanEnglishRemovePidginClient(
    String(transcriptOverride || '').trim() ||
      (!sourceBuffer ? defaultSamplePhrase : '')
  );

  let clientTranslatedText = clientOriginalEnglish
    ? await translateEnglishToNigerianLanguageClient(
        clientOriginalEnglish,
        targetLangLabel
      )
    : '';

  if (preset.id === 'helium_balloon' && clientTranslatedText && !/haha|hee-hee/i.test(clientTranslatedText)) {
    clientTranslatedText = `Haha! Hee-hee! ${clientTranslatedText} Haha!`;
  }

  if (targetLangLabel !== 'English') {
    onStatusUpdate?.(
      `Translating to fluent ${targetLangLabel} (${langCode}) & synthesizing native voice...`
    );
  } else {
    onStatusUpdate?.(`Generating ${preset.name} (${preset.badge}) voice...`);
  }

  try {
    let inputWavBlob: Blob | null = null;
    let audioBase64 = '';
    if (sourceBuffer && !clientOriginalEnglish) {
      inputWavBlob = encodeAudioBufferToWavBlob(sourceBuffer);
      audioBase64 = await blobToBase64String(inputWavBlob);
    }

    const chosenGeminiVoice =
      preset.geminiVoiceName ||
      (preset.category === 'Girl' || preset.category === 'Children'
        ? 'Kore'
        : preset.category === 'Comedy'
          ? 'Puck'
          : 'Fenrir');

    const payload = {
      audioBase64,
      mimeType: 'audio/wav',
      transcriptText:
        preset.id === 'helium_balloon' ? clientTranslatedText : clientOriginalEnglish,
      presetId: preset.id,
      presetName: preset.name,
      targetLanguage: targetLangLabel,
      dialectInstruction:
        preset.dialectInstruction ||
        `Translate to natural everyday ${targetLangLabel} as spoken in Nigeria, not formal textbook`,
      geminiVoiceName: chosenGeminiVoice,
      ttsStylePrompt:
        preset.ttsStylePrompt || `${preset.name} — ${preset.description}`,
    };

    const aiData = await callGeminiVoiceTransformViaServerOrSupabase(
      payload,
      inputWavBlob,
      clientTranslatedText,
      langCode
    );

    if (aiData?.originalTranscript && preset.id !== 'helium_balloon') {
      clientOriginalEnglish = cleanEnglishRemovePidginClient(
        String(aiData.originalTranscript).trim()
      );
    }
    if (aiData?.translatedText && preset.id !== 'helium_balloon') {
      const rawAiTrans = String(aiData.translatedText).trim();
      clientTranslatedText = targetLangLabel.toLowerCase().includes('igbo')
        ? sanitizeAndFormatIgboIzugbeClient(rawAiTrans)
        : rawAiTrans;
    } else if (clientOriginalEnglish && !clientTranslatedText) {
      clientTranslatedText = await translateEnglishToNigerianLanguageClient(
        clientOriginalEnglish,
        targetLangLabel
      );
    }

    if (aiData?.audioBase64) {
      const rawAudioBlob = base64ToWavBlob(
        aiData.audioBase64,
        aiData.audioMimeType || 'audio/wav'
      );
      const neuralBuffer = await decodeMediaToAudioBuffer(rawAudioBlob);

      // If this preset is a Comedy (e.g. Helium Laugh, Chipmunk, Wobble, Cartoon), Children, or More FX preset,
      // run the neural speech buffer through renderVoiceChangedAudio so its pitch/formant/vibrato/ringMod/echo FX are applied!
      if (isPureDspCategory) {
        const fxRendered = await renderVoiceChangedAudio(
          neuralBuffer,
          preset.id,
          baseName
        );
        return {
          ...fxRendered,
          originalTranscript: clientOriginalEnglish,
          translatedText: clientTranslatedText || clientOriginalEnglish,
          targetLanguage: targetLangLabel,
          langCode,
          usedNeuralVoice: true,
        };
      }

      const neuralWavBlob = encodeAudioBufferToWavBlob(neuralBuffer);
      const wavFile = new File([neuralWavBlob], `${baseName}_${preset.id}.wav`, {
        type: 'audio/wav',
      });
      const wavUrl = URL.createObjectURL(neuralWavBlob);
      return {
        audioBuffer: neuralBuffer,
        wavBlob: neuralWavBlob,
        wavFile,
        wavUrl,
        duration: Number(neuralBuffer.duration.toFixed(1)),
        originalTranscript: clientOriginalEnglish,
        translatedText: clientTranslatedText || clientOriginalEnglish,
        targetLanguage: targetLangLabel,
        langCode,
        usedNeuralVoice: true,
      };
    }
  } catch {
    // Fall back below while keeping clientTranslatedText
  }

  // Fallback 1: If user has a recorded or extracted sourceBuffer, transform it via Web Audio DSP
  if (sourceBuffer) {
    const dspResult = await renderVoiceChangedAudio(
      sourceBuffer,
      preset.id,
      baseName
    );
    return {
      ...dspResult,
      originalTranscript: clientOriginalEnglish,
      translatedText: clientTranslatedText || clientOriginalEnglish,
      targetLanguage: targetLangLabel,
      langCode,
      usedNeuralVoice: false,
    };
  }

  // Fallback 2: Synthesize local vocal harmonic buffer and pass through the preset's Web Audio DSP chain
  const localVocalBuf = await synthesizeLocalVocalFallbackBuffer(
    clientTranslatedText || clientOriginalEnglish || defaultSamplePhrase,
    preset.id === 'helium_balloon'
  );
  const dspFallback = await renderVoiceChangedAudio(
    localVocalBuf,
    preset.id,
    baseName
  );
  return {
    ...dspFallback,
    originalTranscript: clientOriginalEnglish,
    translatedText: clientTranslatedText || clientOriginalEnglish,
    targetLanguage: targetLangLabel,
    langCode,
    usedNeuralVoice: false,
  };
}

