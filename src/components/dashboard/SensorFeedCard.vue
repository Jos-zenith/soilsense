<template>
  <div class="sensor-feed bento-card" :class="{ 'pulse-update': isUpdating }">
    <div class="card-header">
      <h3 class="text-xl font-semibold">
        <span class="icon-pot"></span> நேரடி மண் தகவல்கள்
      </h3>
      <span class="text-sm text-earth-gray">Real-time Sensor Feed</span>
    </div>
    
    <div v-if="!sensorData" class="empty-state">
      <div class="spinner"></div>
      <p class="text-sm text-earth-gray">Waiting for sensor data...</p>
    </div>
    
    <div v-else class="sensor-gauges">
      <!-- pH Level Gauge -->
      <div class="gauge-container">
        <div class="gauge-label">
          <span class="icon">⚗️</span>
          <span class="text-sm font-medium">pH Level</span>
        </div>
        <div class="gauge-visual">
          <div 
            class="gauge-meter"
            :class="getPhClass(sensorData.soil_ph)"
            :style="{ width: getPhWidth(sensorData.soil_ph) }"
          ></div>
        </div>
        <div class="gauge-value">
          <span class="value-number text-2xl font-bold">{{ sensorData.soil_ph.toFixed(2) }}</span>
          <span class="value-status" :class="getPhClass(sensorData.soil_ph)">
            {{ getPhStatusText(sensorData.soil_ph) }}
          </span>
        </div>
        <div class="gauge-scale text-xs text-earth-gray">
          <span>4.0</span>
          <span>7.0 (Neutral)</span>
          <span>10.0</span>
        </div>
      </div>
      
      <!-- Moisture Gauge -->
      <div class="gauge-container">
        <div class="gauge-label">
          <span class="icon water-drop-effect">💧</span>
          <span class="text-sm font-medium">Soil Moisture</span>
        </div>
        <div class="gauge-visual">
          <div 
            class="gauge-meter bg-info"
            :style="{ width: getMoisturePercentage(sensorData.moisture) + '%' }"
          ></div>
        </div>
        <div class="gauge-value">
          <span class="value-number text-2xl font-bold">{{ sensorData.moisture }}</span>
          <span class="value-unit text-sm text-earth-gray">mm</span>
        </div>
      </div>
      
      <!-- Temperature Gauge -->
      <div class="gauge-container">
        <div class="gauge-label">
          <span class="icon">🌡️</span>
          <span class="text-sm font-medium">Temperature</span>
        </div>
        <div class="gauge-visual">
          <div 
            class="gauge-meter"
            :class="getTempClass(sensorData.temperature)"
            :style="{ width: getTempPercentage(sensorData.temperature) + '%' }"
          ></div>
        </div>
        <div class="gauge-value">
          <span class="value-number text-2xl font-bold">{{ sensorData.temperature.toFixed(1) }}</span>
          <span class="value-unit text-sm text-earth-gray">°C</span>
        </div>
        <div class="gauge-scale text-xs text-earth-gray">
          <span>10°C</span>
          <span>35°C</span>
        </div>
      </div>
      
      <!-- NPK Levels -->
      <div class="gauge-container">
        <div class="gauge-label">
          <span class="icon">🌱</span>
          <span class="text-sm font-medium">Nitrogen (N)</span>
        </div>
        <div class="gauge-visual">
          <div 
            class="gauge-meter bg-success"
            :style="{ width: getNutrientPercentage(sensorData.nitrogen || 0, 500) + '%' }"
          ></div>
        </div>
        <div class="gauge-value">
          <span class="value-number text-2xl font-bold">{{ sensorData.nitrogen || 0 }}</span>
          <span class="value-unit text-sm text-earth-gray">ppm</span>
        </div>
      </div>

      <div class="gauge-container">
        <div class="gauge-label">
          <span class="icon">🧪</span>
          <span class="text-sm font-medium">Phosphorus (P)</span>
        </div>
        <div class="gauge-visual">
          <div 
            class="gauge-meter bg-warning"
            :style="{ width: getNutrientPercentage(sensorData.phosphorus || 0, 100) + '%' }"
          ></div>
        </div>
        <div class="gauge-value">
          <span class="value-number text-2xl font-bold">{{ sensorData.phosphorus || 0 }}</span>
          <span class="value-unit text-sm text-earth-gray">ppm</span>
        </div>
      </div>

      <div class="gauge-container">
        <div class="gauge-label">
          <span class="icon">🔬</span>
          <span class="text-sm font-medium">Potassium (K)</span>
        </div>
        <div class="gauge-visual">
          <div 
            class="gauge-meter bg-info"
            :style="{ width: getNutrientPercentage(sensorData.potassium || 0, 500) + '%' }"
          ></div>
        </div>
        <div class="gauge-value">
          <span class="value-number text-2xl font-bold">{{ sensorData.potassium || 0 }}</span>
          <span class="value-unit text-sm text-earth-gray">ppm</span>
        </div>
      </div>
      
      <!-- Soil Type -->
      <div class="soil-type-display">
        <div class="gauge-label">
          <span class="icon">🏞️</span>
          <span class="text-sm font-medium">Soil Type - மண் வகை</span>
        </div>
        <div class="soil-type-badge">
          {{ sensorData.soil_type }}
        </div>
      </div>
    </div>
    
    <!-- Last Updated -->
    <div v-if="sensorData" class="timestamp text-xs text-earth-gray">
      Last updated: {{ formatTimestamp(sensorData.timestamp) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useAppStore } from '../../stores/appStore';

const store = useAppStore();
const isUpdating = ref(false);

const sensorData = computed(() => store.sensorData);

// Watch for sensor updates to trigger pulse animation
watch(sensorData, () => {
  isUpdating.value = true;
  setTimeout(() => {
    isUpdating.value = false;
  }, 1000);
});

// pH Helper Functions
const getPhClass = (ph: number): string => {
  if (ph < 5.5) return 'status-danger';
  if (ph > 8.5) return 'status-danger';
  if (ph >= 6.0 && ph <= 7.5) return 'status-success';
  return 'status-warning';
};

const getPhStatusText = (ph: number): string => {
  if (ph < 5.5) return '⚠️ மிகவும் அமிலம் (Too Acidic)';
  if (ph > 8.5) return '⚠️ மிகவும் காரம் (Too Alkaline)';
  if (ph >= 6.0 && ph <= 7.5) return '✅ சிறந்தது (Optimal)';
  return '⚡ கவனம் (Caution)';
};

const getPhWidth = (ph: number): string => {
  // Map pH 4-10 to 0-100%
  const percentage = ((ph - 4) / 6) * 100;
  return Math.min(Math.max(percentage, 0), 100) + '%';
};

// Moisture Helper Functions
const getMoisturePercentage = (moisture: number): number => {
  // Assume max moisture of 500mm for visualization
  return Math.min((moisture / 500) * 100, 100);
};

// Temperature Helper Functions
const getTempClass = (temp: number): string => {
  if (temp < 15 || temp > 35) return 'status-warning';
  return 'status-success';
};

const getTempPercentage = (temp: number): number => {
  // Map 10-40°C to 0-100%
  return ((temp - 10) / 30) * 100;
};

// NPK Helper Functions
const getNutrientPercentage = (value: number, max: number): number => {
  return Math.min((value / max) * 100, 100);
};

// Format timestamp
const formatTimestamp = (timestamp: Date | undefined): string => {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
</script>

<style scoped>
.sensor-feed {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}

.card-header {
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-8);
  flex: 1;
}

.sensor-gauges {
  display: grid;
  gap: var(--space-6);
  flex: 1;
  align-content: space-around;
}

.timestamp {
  flex-shrink: 0;
}

.gauge-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.gauge-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.gauge-visual {
  width: 100%;
  height: 16px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.08) 100%);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gauge-visual::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.gauge-meter {
  height: 100%;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--radius-lg);
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.gauge-meter::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  animation: shimmer-gauge 2s ease-in-out infinite;
}

@keyframes shimmer-gauge {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.status-success {
  background: linear-gradient(90deg, var(--forest-green) 0%, var(--forest-green-light) 100%);
  color: var(--forest-green);
}

.status-warning {
  background: linear-gradient(90deg, var(--sunlit-amber-dark) 0%, var(--sunlit-amber) 100%);
  color: var(--sunlit-amber-dark);
}

.status-danger {
  background: linear-gradient(90deg, var(--clay-red) 0%, var(--clay-red-light) 100%);
  color: var(--clay-red);
}

.bg-info {
  background: linear-gradient(90deg, #0284c7 0%, #0EA5E9 100%);
}

.gauge-value {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.value-status {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.gauge-scale {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-1);
}

.soil-type-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: linear-gradient(135deg, rgba(27, 67, 50, 0.08) 0%, rgba(45, 106, 79, 0.05) 100%);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(27, 67, 50, 0.1);
}

.soil-type-badge {
  display: inline-block;
  padding: var(--space-3) var(--space-5);
  background: linear-gradient(135deg, var(--forest-green) 0%, var(--forest-green-light) 100%);
  color: white;
  border-radius: var(--radius-lg);
  font-weight: 700;
  text-align: center;
  font-size: var(--font-size-lg);
  box-shadow: 0 4px 12px rgba(27, 67, 50, 0.3);
  position: relative;
  overflow: hidden;
}

.soil-type-badge::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  animation: rotate-glow 3s linear infinite;
}

.timestamp {
  text-align: right;
  padding-top: var(--space-3);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  font-style: italic;
  opacity: 0.7;
}
</style>
