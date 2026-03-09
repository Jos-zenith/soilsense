<template>
  <div class="ph-input-card bento-card">
    <div class="card-header">
      <h3 class="text-xl font-semibold">
        <span class="icon">⚗️</span> Manual pH Entry
      </h3>
      <span class="text-sm text-earth-gray">மண் pH உள்ளிடவும்</span>
    </div>
    
    <div class="ph-input-content">
      <div class="input-group">
        <label for="ph-input" class="text-sm font-medium">Soil pH Value</label>
        <div class="input-with-button">
          <input 
            id="ph-input"
            v-model.number="phValue"
            type="number" 
            min="0" 
            max="14" 
            step="0.1"
            placeholder="Enter pH (0-14)"
            class="ph-input"
            @keyup.enter="sendPhToESP32"
          />
          <button 
            @click="sendPhToESP32"
            :disabled="!mqttConnected || !isValidPh"
            class="btn btn-primary"
          >
            📤 Send to ESP32
          </button>
        </div>
        <div class="input-hint" :class="{ 'text-danger': !isValidPh && phValue }">
          {{ getPhHint() }}
        </div>
      </div>

      <div v-if="lastSentPh" class="last-sent">
        <span class="text-sm text-earth-gray">
          Last sent: <strong>pH {{ lastSentPh }}</strong> at {{ lastSentTime }}
        </span>
      </div>

      <div v-if="!mqttConnected" class="warning-box">
        <span>⚠️ Please connect to MQTT first</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/appStore';
import { MQTTSensorService } from '../../services/mqttService';

const store = useAppStore();
const phValue = ref<number | null>(null);
const lastSentPh = ref<number | null>(null);
const lastSentTime = ref<string>('');

const mqttConnected = computed(() => store.mqttConnected);

const isValidPh = computed(() => {
  return phValue.value !== null && phValue.value >= 0 && phValue.value <= 14;
});

const getPhHint = () => {
  if (!phValue.value) return 'Enter a value between 0 and 14';
  if (!isValidPh.value) return '❌ pH must be between 0 and 14';
  if (phValue.value < 5.5) return '⚠️ Highly Acidic';
  if (phValue.value > 8.5) return '⚠️ Highly Alkaline';
  if (phValue.value >= 6.0 && phValue.value <= 7.5) return '✅ Optimal Range';
  return '⚡ Moderate';
};

const sendPhToESP32 = async () => {
  if (!isValidPh.value || !mqttConnected.value) return;
  
  try {
    const mqttService = new MQTTSensorService();
    await mqttService.sendPhValueToSensor(phValue.value!);
    
    lastSentPh.value = phValue.value;
    lastSentTime.value = new Date().toLocaleTimeString();
    
    console.log(`✅ pH ${phValue.value} sent to ESP32`);
    
    // Update store with new pH value
    if (store.sensorData) {
      store.updateSensorData({
        ...store.sensorData,
        soil_ph: phValue.value!
      });
    }
  } catch (error) {
    console.error('❌ Failed to send pH:', error);
    alert('Failed to send pH value. Check MQTT connection.');
  }
};
</script>

<style scoped>
.ph-input-card {
  padding: 1.5rem;
}

.ph-input-content {
  margin-top: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.ph-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--earth-gray);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.ph-input:focus {
  outline: none;
  border-color: var(--forest-green);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary {
  background: var(--forest-green);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--forest-dark);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: var(--earth-gray);
  cursor: not-allowed;
  opacity: 0.5;
}

.input-hint {
  font-size: 0.875rem;
  color: var(--earth-gray);
}

.text-danger {
  color: #e74c3c;
}

.last-sent {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #e7f3ff;
  border-radius: 8px;
}

.warning-box {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  color: #856404;
  text-align: center;
}
</style>
