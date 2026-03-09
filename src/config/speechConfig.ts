/**
 * Speech API Configuration for SoilSense Thozhan
 * Voice Guidance Configuration for Tamil Language Support
 * 
 * API Key: Used for speech synthesis authentication (if required by service)
 * Note: The Web Speech API is built into modern browsers and typically
 * doesn't require an API key. This key can be used for third-party
 * speech services if needed for enhanced Tamil language support.
 */

export interface SpeechConfig {
  apiKey: string;
  defaultLanguage: string;
  fallbackLanguages: string[];
  speechRate: number;
  volume: number;
  voice?: {
    name?: string;
    lang?: string;
  };
}

export const defaultSpeechConfig: SpeechConfig = {
  apiKey: 'isM690PkupSelgtqg9lH4jM8mnpljty9',
  defaultLanguage: 'ta-IN', // Tamil (India)
  fallbackLanguages: ['ta', 'en-IN', 'en-US'],
  speechRate: 0.9, // Slightly slower for clarity
  volume: 1.0,
  voice: {
    lang: 'ta-IN',
  },
};

/**
 * Get Speech API Key
 * @returns The configured speech API key
 */
export const getSpeechApiKey = (): string => {
  return defaultSpeechConfig.apiKey;
};

/**
 * Check if Web Speech API is supported
 * @returns boolean indicating browser support
 */
export const isSpeechApiSupported = (): boolean => {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

/**
 * Get available Tamil voices
 * @returns Array of Tamil voice options
 */
export const getTamilVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechApiSupported()) return [];
  
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => 
    voice.lang.startsWith('ta') || 
    voice.name.toLowerCase().includes('tamil')
  );
};
