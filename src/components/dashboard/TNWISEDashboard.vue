<template>
  <div class="tnwise-dashboard">
    <!-- Animated Background Orbs -->
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <span class="icon-plant">🌾</span>
            <div class="icon-pulse"></div>
          </div>
          <div class="logo-text">
            <h1 class="text-3xl font-bold gradient-text">
              SoilSense Thozhan
            </h1>
            <p class="text-lg tagline">
              மண் உணர்வு தோழன் - Smart Agricultural Knowledge Hub
            </p>
          </div>
        </div>
        
        <div class="header-actions">
          <button 
            @click="toggleMQTT"
            :class="['btn btn-modern', mqttConnected ? 'btn--danger' : 'btn--primary']"
          >
            <span class="btn-pulse" v-if="mqttConnected"></span>
            <span>{{ mqttConnected ? '🔴 Disconnect' : '🟢 Connect Sensors' }}</span>
          </button>
        </div>
      </div>
    </header>
    
    <!-- Bento Grid Dashboard -->
    <main class="bento-grid">
      <!-- Row 1: Sensor Feed (spans 2 columns) + pH Input -->
      <div class="grid-wide grid-item">
        <SensorFeedCard />
      </div>
      
      <div class="grid-item">
        <ManualPhInput />
      </div>
      
      <!-- Row 2: Yield Slider + Voice Guidance -->
      <div class="grid-item">
        <YieldSliderCard />
      </div>
      
      <div class="grid-item">
        <VoiceGuidance />
      </div>
      
      <!-- Row 3: Crop Match Matrix (full width) -->
      <div class="grid-full grid-item">
        <CropMatchMatrix />
      </div>
      
      <!-- Row 4: Money Saved + Nutrient Balance -->
      <div class="grid-item">
        <MoneySavedCard />
      </div>
      
      <div class="grid-item">
        <NutrientBalanceCard />
      </div>
      
      <!-- Row 5: ROI Dashboard (full width) -->
      <div class="grid-full grid-item">
        <ROIDashboard />
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="dashboard-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4 class="text-sm font-semibold text-forest-green">TNWISE 2026 Entry</h4>
          <p class="text-xs text-earth-gray">
            Bridging technology and Tamil Nadu's marginal farmers
          </p>
        </div>
        
        <div class="footer-section">
          <div class="offline-indicator" :class="{ 'is-online': isOnline }">
            <span class="indicator-dot"></span>
            <span class="text-xs">{{ isOnline ? 'Online' : 'Offline Mode' }}</span>
          </div>
        </div>
        
        <div class="footer-section text-right">
          <p class="text-xs text-earth-gray">
            Powered by TNAU Data & IoT Sensors
          </p>
          <p class="text-xs font-semibold text-forest-green">
            Made with ❤️ for farmers
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAppStore } from '../../stores/appStore';
import { MQTTSensorService } from '../../services/mqttService';
import type { SensorData } from '../../types/crop';
import SensorFeedCard from './SensorFeedCard.vue';
import ManualPhInput from './ManualPhInput.vue';
import YieldSliderCard from './YieldSliderCard.vue';
import CropMatchMatrix from './CropMatchMatrix.vue';
import MoneySavedCard from './MoneySavedCard.vue';
import VoiceGuidance from './VoiceGuidance.vue';
import NutrientBalanceCard from './NutrientBalanceCard.vue';
import ROIDashboard from './ROIDashboard.vue';

const store = useAppStore();
const isOnline = ref(navigator.onLine);
const mqttService = ref<MQTTSensorService | null>(null);

const mqttConnected = computed(() => store.mqttConnected);

const toggleMQTT = () => {
  if (mqttConnected.value) {
    // Disconnect from MQTT
    disconnectMQTT();
  } else {
    // Connect to real ESP32 MQTT broker
    connectToRealMQTT();
  }
};

// Connect to real MQTT broker and receive ESP32 data
const connectToRealMQTT = () => {
  console.log('🔌 Connecting to HiveMQ Cloud for real ESP32 data...');
  
  mqttService.value = new MQTTSensorService();
  
  mqttService.value.connectMQTT(
    // On data received from ESP32
    (sensorData: SensorData) => {
      console.log('📡 Real sensor data received from ESP32:', sensorData);
      store.updateSensorData(sensorData);
    },
    // On error
    (error: Error) => {
      console.error('❌ MQTT Error:', error);
      alert('Failed to connect to MQTT broker. Check console for details.');
      store.setMQTTConnection(false);
    },
    // On connected
    () => {
      console.log('✅ Connected! Waiting for ESP32 sensor data...');
      store.setMQTTConnection(true);
    }
  );
};

// Disconnect from MQTT
const disconnectMQTT = () => {
  if (mqttService.value) {
    mqttService.value.disconnectMQTT();
    mqttService.value = null;
  }
  store.setMQTTConnection(false);
  console.log('🔌 Disconnected from MQTT');
};

// Monitor online/offline status
onMounted(() => {
  window.addEventListener('online', () => {
    isOnline.value = true;
  });
  
  window.addEventListener('offline', () => {
    isOnline.value = false;
  });
});

// Cleanup on component unmount
onUnmounted(() => {
  disconnectMQTT();
});
</script>

<style scoped>
.tnwise-dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* Animated Background Orbs */
.bg-orbs {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
  animation: float-orb 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: var(--forest-green);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: var(--sunlit-amber);
  bottom: -150px;
  right: -150px;
  animation-delay: 5s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: var(--clay-red);
  top: 50%;
  left: 50%;
  animation-delay: 10s;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(50px, -50px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
}

/* Enhanced Dashboard Header */
.dashboard-header {
  background: linear-gradient(135deg, 
    var(--forest-green) 0%, 
    var(--forest-green-light) 50%, 
    var(--forest-green) 100%);
  color: white;
  padding: var(--space-6) var(--space-4);
  box-shadow: 
    0 10px 30px rgba(27, 67, 50, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.header-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: rotate-glow 20s linear infinite;
  pointer-events: none;
}

@keyframes rotate-glow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-6);
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  animation: slide-in-left 0.6s ease-out;
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.logo-icon {
  font-size: 3.5rem;
  background: linear-gradient(135deg, white 0%, #f0f0f0 100%);
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xl);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.2),
    inset 0 -2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
  animation: icon-bounce 2s ease-in-out infinite;
}

@keyframes icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.icon-plant {
  position: relative;
  z-index: 2;
}

.icon-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-xl);
  background: radial-gradient(circle, rgba(27, 67, 50, 0.3) 0%, transparent 70%);
  animation: pulse-icon 2s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0; }
}

.gradient-text {
  background: linear-gradient(135deg, white 0%, var(--sunlit-amber) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.3);
}

.tagline {
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
  animation: slide-in-right 0.6s ease-out;
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.btn-modern {
  position: relative;
  overflow: hidden;
}

.btn-pulse {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  top: 10px;
  left: 20px;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}

/* Enhanced Footer */
.dashboard-footer {
  margin-top: auto;
  background: linear-gradient(135deg, 
    var(--forest-green-dark) 0%, 
    #0a1f14 100%);
  color: white;
  padding: var(--space-8) var(--space-4);
  position: relative;
  overflow: hidden;
}

.dashboard-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    var(--sunlit-amber), 
    transparent);
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-6);
  position: relative;
  z-index: 1;
}

.footer-section h4 {
  color: var(--sunlit-amber);
  margin-bottom: var(--space-2);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.footer-section p {
  color: rgba(255, 255, 255, 0.85);
}

.offline-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: rgba(188, 71, 73, 0.2);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(188, 71, 73, 0.4);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.offline-indicator.is-online {
  background: rgba(27, 67, 50, 0.2);
  border-color: rgba(255, 183, 3, 0.5);
  box-shadow: 0 0 20px rgba(255, 183, 3, 0.2);
}

.indicator-dot {
  width: 10px;
  height: 10px;
  background-color: var(--clay-red);
  border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
  animation: blink 2s infinite;
}

.is-online .indicator-dot {
  background-color: #4ade80;
  animation: pulse-online 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes pulse-online {
  0%, 100% { 
    transform: scale(1); 
    box-shadow: 0 0 10px currentColor;
  }
  50% { 
    transform: scale(1.2); 
    box-shadow: 0 0 20px currentColor;
  }
}

/* Grid Item Wrapper - Ensures Full Height */
.grid-item {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
}

.grid-item > * {
  flex: 1;
  height: 100%;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .dashboard-header {
    padding: var(--space-4) var(--space-3);
  }
  
  .logo-section {
    flex-direction: row;
    align-items: center;
  }
  
  .logo-icon {
    width: 60px;
    height: 60px;
    font-size: 2.5rem;
  }
  
  .gradient-text {
    font-size: 1.5rem;
  }
  
  .tagline {
    font-size: 0.875rem;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .text-right {
    text-align: center;
  }
  
  .orb {
    filter: blur(40px);
    opacity: 0.1;
  }
  
  .grid-item {
    min-height: 350px;
  }
}

@media (max-width: 480px) {
  .logo-section {
    gap: var(--space-2);
  }
  
  .header-content {
    gap: var(--space-3);
  }
  
  .grid-item {
    min-height: 320px;
  }
}
</style>
