<template>
  <div class="voice-guidance bento-card">
    <div class="card-header">
      <div>
        <h3 class="text-xl font-semibold">
          🔊 குரல் வழிகாட்டுதல்
        </h3>
        <span class="text-sm text-earth-gray">Voice Guidance for SHG</span>
      </div>
      <div class="voice-status">
        <span :class="['status-indicator', isSpeaking ? 'speaking' : '']"></span>
        <span class="text-xs">{{ isSpeaking ? 'Speaking...' : 'Ready' }}</span>
      </div>
    </div>
    
    <div class="voice-content">
      <div class="voice-info">
        <p class="text-sm text-earth-gray">
          Click the button below to hear crop recommendations in Tamil. 
          Perfect for women's Self-Help Groups (SHGs) and farmers with limited literacy.
        </p>
      </div>
      
      <!-- Current Recommendation Display -->
      <div v-if="recommendations.length > 0 && topCrop" class="recommendation-display">
        <div class="recommendation-header">
          <span class="icon">🌾</span>
          <span class="font-medium">Top Recommendation:</span>
        </div>
        <div class="recommendation-crop">
          <h4 class="text-lg font-semibold text-forest-green">
            {{ topCrop.crop.cropNameEN }} - {{ topCrop.crop.cropNameTA }}
          </h4>
          <div class="recommendation-score">
            {{ topCrop.matchScore }}% Match
          </div>
        </div>
        <div class="recommendation-text">
          {{ getTamilRecommendation() }}
        </div>
      </div>
      
      <!-- Voice Controls -->
      <div class="voice-controls">
        <button 
          @click="speakRecommendation"
          :disabled="isSpeaking || recommendations.length === 0"
          class="btn btn--primary btn--large voice-button"
        >
          <span class="btn-icon">{{ isSpeaking ? '🔊' : '🎤' }}</span>
          <span>{{ isSpeaking ? 'சொல்கிறேன்...' : 'தமிழில் கேளுங்கள்' }}</span>
          <span class="btn-subtitle">{{ isSpeaking ? 'Speaking...' : 'Speak in Tamil' }}</span>
        </button>
        
        <button 
          v-if="isSpeaking"
          @click="stopSpeaking"
          class="btn btn--danger"
        >
          <span class="btn-icon">⏹️</span>
          <span>நிறுத்து (Stop)</span>
        </button>
      </div>
      
      <!-- Language & Settings -->
      <div class="voice-settings">
        <div class="setting-item">
          <label class="setting-label text-sm">Speech Rate:</label>
          <input 
            type="range" 
            v-model="speechRate"
            min="0.5" 
            max="1.5" 
            step="0.1"
            class="setting-slider"
          />
          <span class="setting-value text-sm">{{ speechRate }}x</span>
        </div>
        
        <div class="setting-item">
          <label class="setting-label text-sm">Volume:</label>
          <input 
            type="range" 
            v-model="volume"
            min="0" 
            max="1" 
            step="0.1"
            class="setting-slider"
          />
          <span class="setting-value text-sm">{{ Math.round(volume * 100) }}%</span>
        </div>
        
        <div class="setting-item api-key-display">
          <label class="setting-label text-sm">API Key:</label>
          <div class="api-key-value">
            <span class="text-xs text-forest-green font-medium">{{ speechApiKey.substring(0, 8) }}...{{ speechApiKey.substring(speechApiKey.length - 4) }}</span>
            <span class="status-badge status-badge--success text-xs">✓ Active</span>
          </div>
        </div>
      </div>
      
      <!-- Browser Support Info -->
      <div v-if="!isSpeechSupported" class="support-warning">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text text-sm">
          <strong>Web Speech API not supported</strong>
          <p>Your browser doesn't support text-to-speech. 
            Please use Chrome, Edge, or Safari for voice guidance.</p>
        </div>
      </div>
      
      <!-- Quick Action Phrases -->
      <div class="quick-phrases">
        <div class="phrases-header text-sm font-semibold text-earth-gray">
          Quick Phrases:
        </div>
        <div class="phrases-grid">
          <button 
            @click="speakCustomText('வணக்கம். நான் உங்கள் மண் உணர்வு தோழன்.')"
            class="phrase-btn"
          >
            👋 Greet
          </button>
          <button 
            @click="speakCustomText('உங்கள் மண் தரம் நன்றாக உள்ளது.')"
            class="phrase-btn"
          >
            ✅ Soil Good
          </button>
          <button 
            @click="speakCustomText('பிஹெச் அளவு மாற்றம் தேவை.')"
            class="phrase-btn"
          >
            ⚗️ pH Change
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../../stores/appStore';
import { defaultSpeechConfig, getSpeechApiKey, getTamilVoices } from '../../config/speechConfig';

const store = useAppStore();

const isSpeaking = ref(false);
const speechRate = ref(defaultSpeechConfig.speechRate);
const volume = ref(defaultSpeechConfig.volume);
const currentUtterance = ref<SpeechSynthesisUtterance | null>(null);
const speechApiKey = ref(getSpeechApiKey());

const recommendations = computed(() => store.recommendations);
const topCrop = computed(() => recommendations.value[0]);

const isSpeechSupported = computed(() => {
  return 'speechSynthesis' in window;
});

const getTamilRecommendation = (): string => {
  return store.getTamilRecommendation();
};

const speakRecommendation = () => {
  if (!isSpeechSupported.value || recommendations.value.length === 0) return;
  
  const text = getTamilRecommendation();
  speakText(text);
};

const speakCustomText = (text: string) => {
  if (!isSpeechSupported.value) return;
  speakText(text);
};

const speakText = (text: string) => {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find Tamil voice using config helper
  const tamilVoices = getTamilVoices();
  const selectedVoice = tamilVoices.length > 0 ? tamilVoices[0] : null;
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log('🎤 Using Tamil voice:', selectedVoice.name);
  } else {
    console.warn('⚠️ No Tamil voice found, using default');
  }
  
  utterance.lang = defaultSpeechConfig.defaultLanguage;
  utterance.rate = speechRate.value;
  utterance.volume = volume.value;
  
  utterance.onstart = () => {
    isSpeaking.value = true;
  };
  
  utterance.onend = () => {
    isSpeaking.value = false;
    currentUtterance.value = null;
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    isSpeaking.value = false;
    currentUtterance.value = null;
  };
  
  currentUtterance.value = utterance;
  window.speechSynthesis.speak(utterance);
};

const stopSpeaking = () => {
  window.speechSynthesis.cancel();
  isSpeaking.value = false;
  currentUtterance.value = null;
};

// Initialize speech configuration on component mount
onMounted(() => {
  console.log('🎤 Speech API Key initialized:', speechApiKey.value);
  console.log('🔧 Speech Config:', defaultSpeechConfig);
  
  // Load voices when available
  if (isSpeechSupported.value) {
    window.speechSynthesis.onvoiceschanged = () => {
      const tamilVoices = getTamilVoices();
      console.log('📢 Available Tamil voices:', tamilVoices);
      console.log('📢 All voices:', window.speechSynthesis.getVoices());
    };
    
    // Try to load voices immediately
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const tamilVoices = getTamilVoices();
      console.log('📢 Tamil voices ready:', tamilVoices);
    }
  }
});
</script>

<style scoped>
.voice-guidance {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}

.voice-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-md);
}

.status-indicator {
  width: 10px;
  height: 10px;
  background-color: var(--earth-gray);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-indicator.speaking {
  background-color: var(--clay-red);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

.voice-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1;
  overflow-y: auto;
  max-height: none;
  min-height: 0;
}

.voice-info {
  padding: var(--space-3);
  background-color: rgba(255, 183, 3, 0.1);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--sunlit-amber);
}

.recommendation-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: linear-gradient(135deg, rgba(27, 67, 50, 0.05), rgba(255, 183, 3, 0.05));
  border-radius: var(--radius-md);
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--earth-gray);
}

.recommendation-crop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.recommendation-score {
  padding: var(--space-2) var(--space-4);
  background-color: var(--forest-green);
  color: white;
  border-radius: var(--radius-md);
  font-weight: 600;
}

.recommendation-text {
  padding: var(--space-3);
  background-color: white;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  line-height: var(--leading-normal);
  color: var(--forest-green);
  font-weight: 500;
}

.voice-controls {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.voice-button {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
}

.btn-icon {
  font-size: 1.5rem;
}

.btn-subtitle {
  font-size: var(--font-size-xs);
  opacity: 0.9;
  font-weight: 400;
}

.voice-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-md);
}

.setting-item {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: var(--space-2);
  align-items: center;
}

.setting-label {
  font-weight: 500;
  color: var(--earth-gray);
}

.setting-slider {
  width: 100%;
  height: 6px;
  border-radius: var(--radius-md);
  background: linear-gradient(to right, var(--forest-green), var(--sunlit-amber));
  outline: none;
  cursor: pointer;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--forest-green);
}

.setting-value {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: var(--forest-green);
}

.api-key-display {
  grid-template-columns: 100px 1fr;
  padding-top: var(--space-2);
  margin-top: var(--space-2);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.api-key-value {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.support-warning {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: rgba(188, 71, 73, 0.1);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--clay-red);
}

.warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.warning-text strong {
  color: var(--clay-red);
  display: block;
  margin-bottom: var(--space-1);
}

.quick-phrases {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.phrases-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

@media (max-width: 640px) {
  .phrases-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.phrase-btn {
  padding: var(--space-2);
  background-color: white;
  border: 1px solid var(--forest-green);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--forest-green);
  cursor: pointer;
  transition: all 0.2s ease;
}

.phrase-btn:hover {
  background-color: var(--forest-green);
  color: white;
}

.phrase-btn:active {
  transform: scale(0.95);
}

/* Additional Responsive Adjustments */
@media (max-width: 640px) {
  .voice-button {
    min-width: 100%;
  }
  
  .setting-item {
    grid-template-columns: 80px 1fr auto;
  }
  
  .voice-content {
    max-height: 400px;
  }
}
</style>
