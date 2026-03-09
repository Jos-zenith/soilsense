<template>
  <div class="ph-input-card bento-card">
    <div class="card-header">
      <h3 class="text-xl font-semibold">
        <span class="icon">⚗️</span> Manual pH Entry
      </h3>
      <span class="text-sm text-earth-gray">மண் அமில-காரத்தன்மை</span>
    </div>
    
    <div class="ph-input-container">
      <!-- Simple pH Input -->
      <div class="input-group">
        <label for="phValue" class="input-label">
          📝 Enter Soil pH Value (0-14):
        </label>
        <div class="input-wrapper">
          <input
            id="phValue"
            v-model="phInputValue"
            type="text"
            inputmode="decimal"
            class="ph-input"
            placeholder="Type pH value, e.g., 6.5"
            @input="handleInput"
            @keyup.enter="submitPh"
            autocomplete="off"
          />
          <button 
            @click="submitPh" 
            class="btn btn-modern btn--primary"
            :disabled="!canSubmit"
          >
            {{ isSending ? '⏳ Sending...' : '📤 Send' }}
          </button>
        </div>
        <div class="hint-text" :class="hintClass">
          {{ displayHint }}
        </div>
      </div>
      
      <!-- Current pH Display -->
      <div v-if="currentPh !== null" class="current-ph">
        <div class="ph-display">
          <span class="label">Current pH:</span>
          <span class="value" :class="getPhClass(currentPh)">
            {{ currentPh.toFixed(2) }}
          </span>
          <span class="status-badge" :class="getPhClass(currentPh)">
            {{ getPhStatusText(currentPh) }}
          </span>
        </div>
        
        <!-- pH Scale Visualization -->
        <div class="ph-scale">
          <div class="scale-track">
            <div class="scale-zones">
              <div class="zone acidic">Acidic</div>
              <div class="zone neutral">Neutral</div>
              <div class="zone alkaline">Alkaline</div>
            </div>
            <div 
              class="scale-indicator" 
              :style="{ left: getPhPosition(currentPh) }"
            >
              <div class="indicator-dot"></div>
              <div class="indicator-value">{{ currentPh.toFixed(1) }}</div>
            </div>
          </div>
          <div class="scale-labels">
            <span>0</span>
            <span>7</span>
            <span>14</span>
          </div>
        </div>
      </div>
      
      <div v-if="message" class="message" :class="messageType">
        {{ message }}
      </div>
      
      <div class="ph-guide">
        <p class="text-xs text-earth-gray">
          💡 <strong>Optimal Range:</strong> 6.0 - 7.5 for most crops<br>
          <strong>Tamil Nadu typical:</strong> 6.5 - 7.0 (slightly acidic to neutral)
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/appStore';
import { mqttSensorService } from '../../services/mqttService';

const store = useAppStore();
const phInputValue = ref('');
const isSending = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

const currentPh = computed(() => store.sensorData?.soil_ph ?? null);
const mqttConnected = computed(() => store.mqttConnected);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  phInputValue.value = target.value;
};

const parsedPhValue = computed(() => {
  const value = parseFloat(phInputValue.value);
  return isNaN(value) ? null : value;
});

const isValidPh = computed(() => {
  const value = parsedPhValue.value;
  return value !== null && value >= 0 && value <= 14;
});

const canSubmit = computed(() => {
  return isValidPh.value && !isSending.value && mqttConnected.value;
});

const hintClass = computed(() => {
  if (!phInputValue.value) return '';
  if (!isValidPh.value) return 'error-text';
  if (!mqttConnected.value) return 'warning-text';
  return 'success-text';
});

const displayHint = computed(() => {
  if (!phInputValue.value) return '💡 Type pH value (e.g., 6.5, 7.0)';
  if (!isValidPh.value) return '❌ Invalid pH - must be between 0 and 14';
  if (!mqttConnected.value) return '⚠️ Connect to MQTT sensor first';
  
  const value = parsedPhValue.value!;
  if (value < 5.5) return '⚠️ Too Acidic - consider lime application';
  if (value > 8.5) return '⚠️ Too Alkaline - may need sulfur';
  if (value >= 6.0 && value <= 7.5) return '✅ Optimal pH range for most crops';
  return '⚡ Moderate range - check crop requirements';
});

const submitPh = async () => {
  const value = parsedPhValue.value;
  
  if (!canSubmit.value || value === null) {
    if (!mqttConnected.value) {
      message.value = '❌ Please connect to MQTT first (click "Connect Sensors")';
    } else {
      message.value = '⚠️ Please enter a valid pH value between 0 and 14';
    }
    messageType.value = 'error';
    return;
  }
  
  try {
    isSending.value = true;
    message.value = '';
    
    // Send pH to ESP32 via MQTT
    await mqttSensorService.sendPhValueToSensor(value);
    
    message.value = `✅ pH ${value.toFixed(2)} sent to ESP32!`;
    messageType.value = 'success';
    
    // Update local sensor data immediately
    if (store.sensorData) {
      store.updateSensorData({
        ...store.sensorData,
        soil_ph: value
      });
    }
    
    // Clear input and message after successful send
    setTimeout(() => {
      message.value = '';
      phInputValue.value = '';
    }, 3000);
    
  } catch (error) {
    message.value = `❌ Failed to send pH: ${error instanceof Error ? error.message : 'Unknown error'}`;
    messageType.value = 'error';
  } finally {
    isSending.value = false;
  }
};

// pH Helper Functions
const getPhClass = (ph: number): string => {
  if (ph < 5.5) return 'status-danger';
  if (ph > 8.5) return 'status-danger';
  if (ph >= 6.0 && ph <= 7.5) return 'status-success';
  return 'status-warning';
};

const getPhStatusText = (ph: number): string => {
  if (ph < 5.5) return 'Too Acidic';
  if (ph > 8.5) return 'Too Alkaline';
  if (ph >= 6.0 && ph <= 7.5) return 'Optimal';
  return 'Caution';
};

const getPhPosition = (ph: number): string => {
  // Map pH 0-14 to 0-100% position
  const percentage = (ph / 14) * 100;
  return `${percentage}%`;
};
</script>

<style scoped>
.ph-input-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.ph-input-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-label {
  font-weight: 500;
  color: var(--forest-green);
  font-size: 0.9rem;
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.ph-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--earth-gray);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--forest-green);
  background: white;
  transition: all 0.3s ease;
  cursor: text;
}

.ph-input::placeholder {
  color: #999;
  font-weight: 400;
}

.ph-input:hover {
  border-color: var(--forest-green);
}

.ph-input:focus {
  outline: none;
  border-color: var(--forest-green);
  box-shadow: 0 0 0 3px rgba(45, 80, 22, 0.1);
  background: #fffef7;
}

.hint-text {
  font-size: 0.875rem;
  color: var(--earth-gray);
  margin-top: 0.25rem;
  min-height: 1.5rem;
}

.success-text {
  color: #27ae60;
  font-weight: 500;
}

.warning-text {
  color: #f39c12;
  font-weight: 500;
}

.error-text {
  color: #e74c3c;
  font-weight: 500;
}

.btn {
  padding: 0.75rem 1.5rem;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-ph {
  background: var(--earth-light);
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ph-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.ph-display .label {
  font-weight: 500;
  color: var(--earth-gray);
}

.ph-display .value {
  font-size: 2rem;
  font-weight: 700;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-success {
  color: var(--success-green);
  background: rgba(76, 175, 80, 0.1);
}

.status-warning {
  color: var(--warning-orange);
  background: rgba(255, 152, 0, 0.1);
}

.status-danger {
  color: var(--danger-red);
  background: rgba(244, 67, 54, 0.1);
}

/* pH Scale Visualization */
.ph-scale {
  position: relative;
}

.scale-track {
  height: 40px;
  background: linear-gradient(
    to right,
    #ff4444 0%, 
    #ff8800 25%, 
    #ffdd00 40%, 
    #4caf50 50%, 
    #00bcd4 60%, 
    #2196f3 75%, 
    #9c27b0 100%
  );
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.scale-zones {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  opacity: 0.7;
}

.scale-zones .zone {
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.scale-indicator {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: left 0.3s ease;
}

.indicator-dot {
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid var(--forest-green);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: pulse-dot 2s ease-in-out infinite;
}

.indicator-value {
  position: absolute;
  top: -30px;
  background: var(--forest-green);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

@keyframes pulse-dot {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  color: var(--earth-gray);
  font-weight: 600;
}

.message {
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.message.success {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success-green);
  border-left: 4px solid var(--success-green);
}

.message.error {
  background: rgba(244, 67, 54, 0.1);
  color: var(--danger-red);
  border-left: 4px solid var(--danger-red);
}

.ph-guide {
  background: #e8f5e9;
  padding: 0.75rem;
  border-radius: 8px;
  border-left: 4px solid var(--success-green);
}

@media (max-width: 768px) {
  .input-wrapper {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
