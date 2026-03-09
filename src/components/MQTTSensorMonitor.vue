<template>
  <div class="mqtt-sensor-monitor">
    <div class="connection-status">
      <div :class="['status-indicator', mqttConnected ? 'connected' : 'disconnected']">
        <span class="status-dot"></span>
        {{ mqttConnected ? 'MQTT Connected' : 'MQTT Disconnected' }}
      </div>
      <button @click="toggleConnection" class="btn-primary">
        {{ mqttConnected ? 'Disconnect' : 'Connect to Sensors' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
    </div>

    <div v-if="sensorData" class="sensor-data-grid">
      <div class="sensor-card">
        <h3>🌡️ Temperature</h3>
        <p class="value">{{ sensorData.temperature.toFixed(1) }}°C</p>
        <p class="range">Optimal: 20-30°C</p>
      </div>

      <div class="sensor-card">
        <h3>💧 Moisture</h3>
        <p class="value">{{ sensorData.moisture }}</p>
        <p class="range">{{ getMoistureLevel(sensorData.moisture) }}</p>
      </div>

      <div class="sensor-card">
        <h3>⚗️ Soil pH</h3>
        <p class="value">{{ sensorData.soil_ph.toFixed(2) }}</p>
        <p class="range">{{ getPhLevel(sensorData.soil_ph) }}</p>
      </div>

      <div class="sensor-card">
        <h3>🌱 Soil Type</h3>
        <p class="value">{{ sensorData.soil_type }}</p>
      </div>
    </div>

    <div v-if="mqttConnected" class="ph-control">
      <h3>Manual pH Entry</h3>
      <p>Enter pH value to send to sensor:</p>
      <div class="input-group">
        <input
          v-model.number="manualPh"
          type="number"
          min="0"
          max="14"
          step="0.1"
          placeholder="6.5"
          class="ph-input"
        />
        <button @click="sendPhToSensor" class="btn-secondary">
          Send to ESP32
        </button>
      </div>
    </div>

    <div v-if="sensorData" class="timestamp">
      Last update: {{ formatTimestamp(sensorData.timestamp) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { sensorService } from '../services/sensorService';
import type { SensorData } from '../types/crop';

const sensorData = ref<SensorData | null>(null);
const mqttConnected = ref(false);
const error = ref('');
const manualPh = ref(6.5);

function toggleConnection() {
  if (mqttConnected.value) {
    disconnect();
  } else {
    connect();
  }
}

function connect() {
  error.value = '';
  
  sensorService.connectMQTT(
    (data: SensorData) => {
      sensorData.value = data;
      error.value = '';
    },
    (err: Error) => {
      error.value = err.message;
      mqttConnected.value = false;
    },
    () => {
      mqttConnected.value = true;
      console.log('Successfully connected to MQTT broker');
    }
  );
}

function disconnect() {
  sensorService.disconnectMQTT();
  mqttConnected.value = false;
  sensorData.value = null;
}

function sendPhToSensor() {
  if (manualPh.value >= 0 && manualPh.value <= 14) {
    sensorService.sendPhValueToSensor(manualPh.value);
    console.log(`Sent pH ${manualPh.value} to sensor`);
  } else {
    error.value = 'pH must be between 0 and 14';
  }
}

function getMoistureLevel(moisture: number): string {
  if (moisture < 300) return 'Very Dry';
  if (moisture < 600) return 'Dry';
  if (moisture < 900) return 'Optimal';
  return 'Very Wet';
}

function getPhLevel(ph: number): string {
  if (ph < 5.5) return 'Acidic';
  if (ph < 6.5) return 'Slightly Acidic';
  if (ph < 7.5) return 'Neutral';
  if (ph < 8.5) return 'Slightly Alkaline';
  return 'Alkaline';
}

function formatTimestamp(timestamp?: Date): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString();
}

onMounted(() => {
  // Auto-connect on mount (optional)
  // connect();
});

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped>
.mqtt-sensor-monitor {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.connected .status-dot {
  background: #4caf50;
  box-shadow: 0 0 8px #4caf50;
  animation: pulse 2s infinite;
}

.disconnected .status-dot {
  background: #f44336;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #c62828;
}

.sensor-data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.sensor-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s;
}

.sensor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.sensor-card h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.sensor-card .value {
  font-size: 32px;
  font-weight: bold;
  color: #2196f3;
  margin: 10px 0;
}

.sensor-card .range {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.ph-control {
  background: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.ph-control h3 {
  margin-top: 0;
  color: #1976d2;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.ph-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #2196f3;
  border-radius: 6px;
  font-size: 16px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-primary:hover {
  background: #1976d2;
}

.btn-secondary {
  background: #4caf50;
  color: white;
}

.btn-secondary:hover {
  background: #388e3c;
}

.timestamp {
  text-align: center;
  color: #666;
  font-size: 14px;
  font-style: italic;
}
</style>
