<template>
  <div class="crop-matrix bento-card">
    <div class="card-header">
      <div>
        <h3 class="text-xl font-semibold">
          <span class="icon-seedling"></span> பயிர் பொருத்த மேட்ரிக்ஸ்
        </h3>
        <span class="text-sm text-earth-gray">Crop Match Matrix</span>
      </div>
      <div v-if="recommendations.length > 0" class="match-count">
        {{ recommendations.length }} crops matched
      </div>
    </div>
    
    <div v-if="recommendations.length === 0" class="empty-state">
      <div class="empty-icon">🌾</div>
      <p class="text-base font-medium">No sensor data available</p>
      <p class="text-sm text-earth-gray">Connect to sensors to get crop recommendations</p>
    </div>
    
    <div v-else class="crop-grid">
      <div 
        v-for="(rec, index) in topRecommendations" 
        :key="rec.crop.id"
        class="crop-card"
        :class="{ 'golden-border': rec.matchScore >= 90 }"
      >
        <div class="crop-rank" :class="getRankClass(index)">
          #{{ index + 1 }}
        </div>
        
        <div class="crop-header">
          <h4 class="crop-name-en text-lg font-semibold">
            {{ rec.crop.cropNameEN }}
          </h4>
          <p class="crop-name-ta text-sm text-earth-gray">
            {{ rec.crop.cropNameTA }}
          </p>
        </div>
        
        <div class="match-score-container">
          <div class="match-score-bar">
            <div 
              class="match-score-fill"
              :style="{ width: rec.matchScore + '%' }"
              :class="getScoreClass(rec.matchScore)"
            ></div>
          </div>
          <div class="match-score-value" :class="getScoreClass(rec.matchScore)">
            {{ rec.matchScore }}% Match
          </div>
        </div>
        
        <div class="crop-details">
          <div class="detail-row">
            <span class="detail-icon">🌱</span>
            <span class="detail-text text-sm">{{ rec.crop.soilTypeEN }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-icon">⚗️</span>
            <span class="detail-text text-sm">
              pH: {{ rec.crop.phRange.min }} - {{ rec.crop.phRange.max }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-icon">🌡️</span>
            <span class="detail-text text-sm">
              {{ rec.crop.tempRange.min }}°C - {{ rec.crop.tempRange.max }}°C
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-icon">💧</span>
            <span class="detail-text text-sm">
              {{ rec.crop.waterRequirement }} mm
            </span>
          </div>
        </div>
        
        <div class="fertilizer-info">
          <div class="fertilizer-label text-xs font-semibold text-earth-gray">
            Fertilizer - உரம்:
          </div>
          <div class="fertilizer-npk text-sm font-medium text-forest-green">
            NPK {{ rec.crop.primaryFertilizer }}
          </div>
        </div>
        
        <button 
          @click="selectCrop(rec)"
          class="btn btn--primary btn-select"
          :class="{ 'btn-selected': selectedCrop?.crop.id === rec.crop.id }"
        >
          {{ selectedCrop?.crop.id === rec.crop.id ? '✓ Selected' : 'Select Crop' }}
        </button>
      </div>
    </div>
    
    <!-- Show more button -->
    <div v-if="recommendations.length > displayLimit" class="show-more">
      <button 
        @click="toggleShowAll"
        class="btn btn--secondary"
      >
        {{ showAll ? 'Show Less' : `Show All ${recommendations.length} Crops` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '../../stores/appStore';
import type { CropRecommendation } from '../../types/crop';

const store = useAppStore();
const showAll = ref(false);
const displayLimit = 6;
const selectedCrop = ref<CropRecommendation | null>(null);

const recommendations = computed(() => store.recommendations);

const topRecommendations = computed(() => {
  if (showAll.value) {
    return recommendations.value;
  }
  return recommendations.value.slice(0, displayLimit);
});

const toggleShowAll = () => {
  showAll.value = !showAll.value;
};

const selectCrop = (rec: CropRecommendation) => {
  selectedCrop.value = rec;
  // Recalculate fertilizer doses for selected crop
  store.calculateSTCRDose(rec.crop);
};

const getRankClass = (index: number): string => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return '';
};

const getScoreClass = (score: number): string => {
  if (score >= 90) return 'score-excellent';
  if (score >= 75) return 'score-good';
  if (score >= 60) return 'score-fair';
  return 'score-low';
};
</script>

<style scoped>
.crop-matrix {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.match-count {
  padding: var(--space-2) var(--space-4);
  background-color: var(--forest-green);
  color: white;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-12);
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.crop-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.crop-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: white;
  border-radius: var(--radius-lg);
  border: 2px solid rgba(0, 0, 0, 0.05);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  position: relative;
}

.crop-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.crop-rank {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--earth-gray);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-md);
}

.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
}

.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
}

.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #B8732E);
}

.crop-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.crop-name-en {
  color: var(--forest-green);
}

.match-score-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.match-score-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.match-score-fill {
  height: 100%;
  transition: width 0.6s ease-out;
  border-radius: var(--radius-md);
}

.score-excellent { background-color: var(--forest-green); color: var(--forest-green); }
.score-good { background-color: var(--sunlit-amber); color: var(--sunlit-amber-dark); }
.score-fair { background-color: var(--info); color: var(--info); }
.score-low { background-color: var(--earth-gray); color: var(--earth-gray); }

.match-score-value {
  font-weight: 700;
  font-size: var(--font-size-sm);
  text-align: right;
}

.crop-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.detail-icon {
  font-size: var(--font-size-lg);
}

.fertilizer-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background-color: rgba(27, 67, 50, 0.05);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--forest-green);
}

.btn-select {
  margin-top: auto;
  width: 100%;
}

.btn-selected {
  background-color: var(--clay-red);
}

.show-more {
  text-align: center;
}
</style>
