<!--
  Example: Complete Integration with MQTT and Crop Recommendations
  
  This example shows how to:
  1. Connect to MQTT sensors
  2. Display real-time sensor data
  3. Get crop recommendations based on sensor readings
  4. Show results in Tamil and English
-->

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>🌾 SoilSense Thozhan - மண் உணர்வு தோழன்</h1>
      <p class="subtitle">Smart Crop Recommendation System with IoT Sensors</p>
    </header>

    <!-- MQTT Sensor Connection Status -->
    <div class="connection-panel">
      <div :class="['status-badge', mqttConnected ? 'connected' : 'disconnected']">
        {{ mqttConnected ? '✅ Sensors Connected' : '❌ Sensors Offline' }}
      </div>
      <button @click="toggleMQTT" class="btn-connect">
        {{ mqttConnected ? 'Disconnect' : 'Connect to ESP32 Sensors' }}
      </button>
    </div>

    <!-- Real-time Sensor Data Display -->
    <div v-if="sensorData" class="sensor-dashboard">
      <h2>📊 Live Sensor Readings</h2>
      <div class="sensor-grid">
        <div class="sensor-card temp">
          <div class="icon">🌡️</div>
          <div class="value">{{ sensorData.temperature.toFixed(1) }}°C</div>
          <div class="label">Temperature</div>
        </div>
        
        <div class="sensor-card moisture">
          <div class="icon">💧</div>
          <div class="value">{{ sensorData.moisture }}</div>
          <div class="label">Soil Moisture</div>
        </div>
        
        <div class="sensor-card ph">
          <div class="icon">⚗️</div>
          <div class="value">{{ sensorData.soil_ph.toFixed(2) }}</div>
          <div class="label">pH Level</div>
        </div>
        
        <div class="sensor-card soil">
          <div class="icon">🌱</div>
          <div class="value">{{ sensorData.soil_type }}</div>
          <div class="label">Soil Type</div>
        </div>
      </div>
    </div>

    <!-- Crop Recommendations -->
    <div v-if="sensorData" class="recommendations-section">
      <button @click="getCropRecommendations" class="btn-recommend" :disabled="loading">
        {{ loading ? '🔄 Analyzing...' : '🌾 Get Crop Recommendations' }}
      </button>

      <div v-if="recommendations.length > 0" class="recommendations-list">
        <h2>🎯 Recommended Crops - பரிந்துரைக்கப்பட்ட பயிர்கள்</h2>
        
        <div v-for="(rec, index) in recommendations" :key="index" class="crop-card">
          <div class="crop-header">
            <h3>{{ rec.crop.cropNameEN }} - {{ rec.crop.cropNameTA }}</h3>
            <div class="match-score">{{ rec.matchScore }}% Match</div>
          </div>

          <div class="crop-details">
            <div class="detail-row">
              <strong>Soil Type:</strong>
              {{ rec.crop.soilTypeEN }} - {{ rec.crop.soilTypeTA }}
            </div>
            
            <div class="detail-row">
              <strong>pH Range:</strong>
              {{ rec.crop.phRange.min }} - {{ rec.crop.phRange.max }}
              <span :class="getPhStatus(rec.crop.phRange)">
                {{ getPhStatusText(rec.crop.phRange) }}
              </span>
            </div>
            
            <div class="detail-row">
              <strong>Temperature Range:</strong>
              {{ rec.crop.tempRange.min }}°C - {{ rec.crop.tempRange.max }}°C
              <span :class="getTempStatus(rec.crop.tempRange)">
                {{ getTempStatusText(rec.crop.tempRange) }}
              </span>
            </div>

            <div class="detail-row">
              <strong>Water Requirement:</strong>
              {{ rec.crop.waterRequirement }} mm
            </div>
          </div>

          <div class="fertilizer-info">
            <h4>🧪 Fertilizer Recommendations</h4>
            <p><strong>Primary NPK:</strong> {{ rec.crop.primaryFertilizer }}</p>
            <p><strong>Micronutrients:</strong> {{ rec.crop.micronutrients }}</p>
            <p class="tamil">{{ rec.crop.fertilizerActionTA }}</p>
          </div>

          <div v-if="rec.actionRequired.length > 0" class="actions-required">
            <h4>⚠️ Actions Required</h4>
            <ul>
              <li v-for="(action, idx) in rec.actionRequired" :key="idx">{{ action }}</li>
            </ul>
          </div>

          <div class="reasons">
            <h4>✓ Why This Crop?</h4>
            <ul>
              <li v-for="(reason, idx) in rec.reasons" :key="idx">{{ reason }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual pH Entry -->
    <div v-if="mqttConnected" class="ph-entry">
      <h3>🔧 Manual pH Calibration</h3>
      <p>Send pH value to ESP32 sensor:</p>
      <div class="input-group">
        <input v-model.number="manualPh" type="number" min="0" max="14" step="0.1" />
        <button @click="sendPhToSensor" class="btn-send">Send to ESP32</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { sensorService } from '../services/sensorService';
import { recommendationEngine } from '../services/recommendationEngine';
import type { SensorData, CropRecommendation } from '../types/crop';

const sensorData = ref<SensorData | null>(null);
const recommendations = ref<CropRecommendation[]>([]);
const mqttConnected = ref(false);
const loading = ref(false);
const manualPh = ref(6.5);

function toggleMQTT() {
  if (mqttConnected.value) {
    sensorService.disconnectMQTT();
    mqttConnected.value = false;
    sensorData.value = null;
    recommendations.value = [];
  } else {
    sensorService.connectMQTT(
      (data: SensorData) => {
        sensorData.value = data;
        console.log('📡 Sensor data received:', data);
      },
      (error: Error) => {
        console.error('❌ MQTT Error:', error);
        alert(`Connection error: ${error.message}`);
      },
      () => {
        mqttConnected.value = true;
        console.log('✅ MQTT Connected successfully!');
      }
    );
  }
}

async function getCropRecommendations() {
  if (!sensorData.value) return;
  
  loading.value = true;
  try {
    const recs = recommendationEngine.getRecommendations(sensorData.value);
    recommendations.value = recs;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    alert('Failed to get crop recommendations');
  } finally {
    loading.value = false;
  }
}

function sendPhToSensor() {
  if (manualPh.value >= 0 && manualPh.value <= 14) {
    sensorService.sendPhValueToSensor(manualPh.value);
    alert(`pH ${manualPh.value} sent to ESP32!`);
  } else {
    alert('pH must be between 0 and 14');
  }
}

function getPhStatus(phRange: { min: number; max: number }): string {
  if (!sensorData.value) return '';
  const ph = sensorData.value.soil_ph;
  return ph >= phRange.min && ph <= phRange.max ? 'status-good' : 'status-warn';
}

function getPhStatusText(phRange: { min: number; max: number }): string {
  if (!sensorData.value) return '';
  const ph = sensorData.value.soil_ph;
  return ph >= phRange.min && ph <= phRange.max ? '✓ Optimal' : '⚠ Needs Adjustment';
}

function getTempStatus(tempRange: { min: number; max: number }): string {
  if (!sensorData.value) return '';
  const temp = sensorData.value.temperature;
  return temp >= tempRange.min && temp <= tempRange.max ? 'status-good' : 'status-warn';
}

function getTempStatusText(tempRange: { min: number; max: number }): string {
  if (!sensorData.value) return '';
  const temp = sensorData.value.temperature;
  return temp >= tempRange.min && temp <= tempRange.max ? '✓ Optimal' : '⚠ Needs Adjustment';
}
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  font-size: 18px;
}

.connection-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 30px;
}

.status-badge {
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
}

.status-badge.connected {
  background: #d4edda;
  color: #155724;
}

.status-badge.disconnected {
  background: #f8d7da;
  color: #721c24;
}

.btn-connect, .btn-recommend, .btn-send {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-connect {
  background: #007bff;
  color: white;
}

.btn-connect:hover {
  background: #0056b3;
}

.btn-recommend {
  background: #28a745;
  color: white;
  width: 100%;
  margin: 20px 0;
  font-size: 18px;
}

.btn-recommend:hover:not(:disabled) {
  background: #218838;
}

.btn-recommend:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.sensor-dashboard h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.sensor-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.2s;
}

.sensor-card:hover {
  transform: translateY(-5px);
}

.sensor-card .icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.sensor-card .value {
  font-size: 28px;
  font-weight: bold;
  color: #007bff;
  margin: 10px 0;
}

.sensor-card .label {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.crop-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.crop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.crop-header h3 {
  margin: 0;
  color: #2c3e50;
}

.match-score {
  background: #28a745;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
}

.crop-details {
  margin-bottom: 20px;
}

.detail-row {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row strong {
  color: #495057;
  margin-right: 10px;
}

.status-good {
  color: #28a745;
  font-weight: 600;
  margin-left: 10px;
}

.status-warn {
  color: #ffc107;
  font-weight: 600;
  margin-left: 10px;
}

.fertilizer-info {
  background: #e7f3ff;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}

.fertilizer-info h4 {
  margin-top: 0;
  color: #004085;
}

.tamil {
  color: #666;
  font-style: italic;
  margin-top: 10px;
}

.actions-required {
  background: #fff3cd;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}

.actions-required h4 {
  margin-top: 0;
  color: #856404;
}

.reasons {
  background: #d4edda;
  padding: 15px;
  border-radius: 8px;
}

.reasons h4 {
  margin-top: 0;
  color: #155724;
}

.reasons ul, .actions-required ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.ph-entry {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-top: 30px;
}

.ph-entry h3 {
  margin-top: 0;
  color: #2c3e50;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.input-group input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
}

.btn-send {
  background: #17a2b8;
  color: white;
}

.btn-send:hover {
  background: #138496;
}
</style>
