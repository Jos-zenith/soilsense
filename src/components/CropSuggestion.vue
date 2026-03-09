<template>
  <div class="crop-suggestion">
    <h1>🌾 Crop Recommendation System</h1>

    <!-- Sensor Input Form -->
    <div class="sensor-input">
      <h2>Enter Sensor Data</h2>
      <div class="form-grid">
        <div class="form-group">
          <label>Soil pH</label>
          <input v-model.number="sensorData.soil_ph" type="number" step="0.1" placeholder="e.g., 6.5" />
        </div>

        <div class="form-group">
          <label>Temperature (°C)</label>
          <input v-model.number="sensorData.temperature" type="number" placeholder="e.g., 28" />
        </div>

        <div class="form-group">
          <label>Soil Type</label>
          <select v-model="sensorData.soil_type">
            <option value="">Select Soil Type</option>
            <option value="clayey soil">Clayey Soil</option>
            <option value="sandy loam">Sandy Loam Soil</option>
            <option value="well-draining">Well-Draining Soil</option>
            <option value="clayey loam">Clayey Loam Soil</option>
            <option value="deep clayey">Deep Clayey Soil</option>
          </select>
        </div>

        <div class="form-group">
          <label>Soil Moisture (mm)</label>
          <input v-model.number="sensorData.moisture" type="number" placeholder="e.g., 500" />
        </div>
      </div>

      <button @click="fetchSuggestions" :disabled="loading">
        {{ loading ? 'Fetching...' : 'Get Recommendations' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>⏳ Analyzing sensor data...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error">
      <p>❌ Error: {{ error }}</p>
    </div>

    <!-- Recommendations -->
    <div v-if="recommendations.length > 0" class="recommendations">
      <h2>Recommended Crops</h2>

      <div v-for="(rec, index) in recommendations" :key="index" class="recommendation-card">
        <div class="card-header">
          <h3>
            {{ rec.crop.cropNameEN }}
            <span class="tamil">({{ rec.crop.cropNameTA }})</span>
          </h3>
          <div class="match-score">
            <span class="score-value">{{ rec.matchScore }}%</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: rec.matchScore + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Crop Requirements -->
        <div class="crop-details">
          <div class="detail-item">
            <span class="label">pH Range:</span>
            <span class="value">{{ rec.crop.phRange.min }} - {{ rec.crop.phRange.max }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Temperature:</span>
            <span class="value">{{ rec.crop.tempRange.min }}°C - {{ rec.crop.tempRange.max }}°C</span>
          </div>
          <div class="detail-item">
            <span class="label">Water Required:</span>
            <span class="value">{{ rec.crop.waterRequirement }} mm</span>
          </div>
          <div class="detail-item">
            <span class="label">Soil Type:</span>
            <span class="value">{{ rec.crop.soilTypeEN }} ({{ rec.crop.soilTypeTA }})</span>
          </div>
        </div>

        <!-- Match Reasons -->
        <div class="reasons">
          <h4>Analysis:</h4>
          <ul>
            <li v-for="(reason, i) in rec.reasons" :key="i">{{ reason }}</li>
          </ul>
        </div>

        <!-- Required Actions -->
        <div class="actions">
          <h4>🌱 Fertilizer & Actions:</h4>
          <ul>
            <li v-for="(action, i) in rec.actionRequired" :key="i">{{ action }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="recommendations.length === 0 && !loading && !error" class="empty-state">
      <p>Enter sensor data and click "Get Recommendations" to see suitable crops</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useCropRecommendations } from '../composables/useCropRecommendations';
import type { SensorData } from '../types/crop';

const { recommendations, loading, error, getSuggestions } = useCropRecommendations();

const sensorData = reactive<SensorData>({
  soil_ph: 6.5,
  soil_type: 'clayey soil',
  temperature: 28,
  moisture: 500,
});

const fetchSuggestions = async () => {
  await getSuggestions(sensorData);
};
</script>

<style scoped>
.crop-suggestion {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: #2d5016;
  margin-bottom: 30px;
}

h2 {
  color: #2d5016;
  margin-top: 30px;
  margin-bottom: 20px;
}

h3 {
  margin: 0;
  color: #2d5016;
}

h4 {
  color: #4a7c1c;
  margin: 15px 0 10px 0;
}

/* Sensor Input Form */
.sensor-input {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4a7c1c;
  box-shadow: 0 0 4px rgba(74, 124, 28, 0.3);
}

button {
  background: #4a7c1c;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s;
}

button:hover:not(:disabled) {
  background: #2d5016;
}

button:disabled {
  background: #999;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 40px;
  background: #e8f5e9;
  border-radius: 8px;
  color: #2d5016;
  font-size: 16px;
}

/* Error State */
.error {
  background: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 8px;
  padding: 20px;
  color: #c62828;
  margin-bottom: 20px;
}

/* Recommendations */
.recommendations {
  margin-top: 30px;
}

.recommendation-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
}

.card-header h3 {
  flex: 1;
}

.tamil {
  color: #666;
  font-size: 0.8em;
  margin-left: 10px;
  font-weight: normal;
}

/* Match Score */
.match-score {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
  color: #4a7c1c;
  min-width: 50px;
  text-align: right;
}

.score-bar {
  width: 150px;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a7c1c, #7cb342);
  border-radius: 4px;
  transition: width 0.3s;
}

/* Crop Details */
.crop-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  background: #fafafa;
  padding: 15px;
  border-radius: 4px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
}

.detail-item .label {
  font-weight: 600;
  color: #666;
}

.detail-item .value {
  color: #2d5016;
  font-weight: 500;
}

/* Reasons & Actions */
.reasons,
.actions {
  margin-bottom: 15px;
}

.reasons ul,
.actions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.reasons li,
.actions li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  color: #555;
  line-height: 1.5;
}

.reasons li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #4a7c1c;
  font-weight: bold;
}

.actions li:before {
  content: '→';
  position: absolute;
  left: 0;
  color: #ff9800;
  font-weight: bold;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .match-score {
    width: 100%;
  }

  .crop-details {
    grid-template-columns: 1fr;
  }
}
</style>
