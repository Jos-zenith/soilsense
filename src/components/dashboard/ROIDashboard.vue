<template>
  <div class="roi-dashboard bento-card">
    <div class="card-header">
      <div>
        <h3 class="text-xl font-semibold">
          📈 பயிர் தாக்க பகுப்பாய்வு
        </h3>
        <span class="text-sm text-earth-gray">Economic Impact Dashboard</span>
      </div>
    </div>
    
    <div class="roi-content">
      <!-- Key Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-value text-3xl font-bold text-forest-green">
            {{ targetYield }}
          </div>
          <div class="metric-label text-sm text-earth-gray">
            Target Yield (tonnes/ha)
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-value text-3xl font-bold text-sunlit-amber">
            {{ fueImprovement }}%
          </div>
          <div class="metric-label text-sm text-earth-gray">
            Fertilizer Use Efficiency Gain
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">💰</div>
          <div class="metric-value text-3xl font-bold text-forest-green">
            ₹{{ Math.abs(moneySaved).toLocaleString('en-IN') }}
          </div>
          <div class="metric-label text-sm text-earth-gray">
            Potential Savings per Ha
          </div>
        </div>
      </div>
      
      <!-- Yield Gap Comparison -->
      <div class="yield-comparison">
        <h4 class="text-lg font-semibold text-forest-green mb-4">
          Yield Gap Closer - மகசூல் இடைவெளி
        </h4>
        
        <div class="comparison-bars">
          <div class="comparison-item">
            <div class="comparison-label">
              <span class="label-text font-medium">District Average</span>
              <span class="label-subtitle text-sm text-earth-gray">மாவட்ட சராசரி</span>
            </div>
            <div class="comparison-bar-container">
              <div 
                class="comparison-bar bar-district"
                :style="{ width: getDistrictPercentage() + '%' }"
              >
                <span class="bar-label">{{ districtAverage }} t/ha</span>
              </div>
            </div>
          </div>
          
          <div class="comparison-item">
            <div class="comparison-label">
              <span class="label-text font-medium">SoilSense Potential</span>
              <span class="label-subtitle text-sm text-earth-gray">மண் உணர்வு திறன்</span>
            </div>
            <div class="comparison-bar-container">
              <div 
                class="comparison-bar bar-soilsense"
                :style="{ width: getSoilSensePercentage() + '%' }"
              >
                <span class="bar-label">{{ targetYield }} t/ha</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="yield-gap-info">
          <div class="info-icon">📊</div>
          <p class="text-sm">
            With SoilSense, you can achieve 
            <strong class="text-forest-green">{{ getYieldIncrease() }}% increase</strong>
            over district average, bridging the yield gap through precision nutrient management.
          </p>
        </div>
      </div>
      
      <!-- FUE Gauge -->
      <div class="fue-section">
        <h4 class="text-lg font-semibold text-forest-green mb-4">
          Fertilizer Use Efficiency (FUE)
        </h4>
        
        <div class="fue-comparison">
          <div class="fue-item">
            <div class="fue-label text-sm text-earth-gray">Blanket Dose Method</div>
            <div class="fue-gauge">
              <div class="gauge-background">
                <div 
                  class="gauge-fill fue-blanket"
                  :style="{ width: blanketFUE + '%' }"
                ></div>
              </div>
              <div class="fue-value text-2xl font-bold text-clay-red">
                {{ blanketFUE }}%
              </div>
            </div>
          </div>
          
          <div class="fue-arrow">→</div>
          
          <div class="fue-item">
            <div class="fue-label text-sm text-earth-gray">SoilSense Method</div>
            <div class="fue-gauge">
              <div class="gauge-background">
                <div 
                  class="gauge-fill fue-soilsense"
                  :style="{ width: siteSpecificFUE + '%' }"
                ></div>
              </div>
              <div class="fue-value text-2xl font-bold text-forest-green">
                {{ siteSpecificFUE }}%
              </div>
            </div>
          </div>
        </div>
        
        <div class="fue-explanation">
          <p class="text-sm text-earth-gray">
            <strong>What is FUE?</strong> Fertilizer Use Efficiency measures how much of applied 
            nutrients are actually absorbed by crops. Higher efficiency = less waste + more savings.
          </p>
        </div>
      </div>
      
      <!-- Environmental Impact -->
      <div class="environmental-impact">
        <h4 class="text-lg font-semibold text-forest-green mb-3">
          🌱 Environmental Benefits - சுற்றுச்சூழல் நன்மைகள்
        </h4>
        
        <div class="impact-grid">
          <div class="impact-item">
            <div class="impact-value text-2xl font-bold text-forest-green">
              {{ getReducedNitrogen() }} kg
            </div>
            <div class="impact-label text-sm text-earth-gray">
              Reduced N Runoff
            </div>
          </div>
          
          <div class="impact-item">
            <div class="impact-value text-2xl font-bold text-forest-green">
              {{ getCo2Saved() }} kg
            </div>
            <div class="impact-label text-sm text-earth-gray">
              CO₂ Emissions Saved
            </div>
          </div>
          
          <div class="impact-item">
            <div class="impact-value text-2xl font-bold text-forest-green">
              ✓
            </div>
            <div class="impact-label text-sm text-earth-gray">
              Soil Health Protected
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../../stores/appStore';

const store = useAppStore();

const targetYield = computed(() => store.targetYield);
const moneySaved = computed(() => store.moneySaved);
const fueData = computed(() => store.fertilizerEfficiency);

const blanketFUE = computed(() => fueData.value.blanket);
const siteSpecificFUE = computed(() => fueData.value.siteSpecific);
const fueImprovement = computed(() => fueData.value.improvement);

// District averages (can be made dynamic based on crop selection)
const districtAverage = computed(() => {
  // Default to paddy average, can be enhanced
  return 4.5;
});

const getDistrictPercentage = () => {
  const max = Math.max(districtAverage.value, targetYield.value);
  return (districtAverage.value / max) * 100;
};

const getSoilSensePercentage = () => {
  const max = Math.max(districtAverage.value, targetYield.value);
  return (targetYield.value / max) * 100;
};

const getYieldIncrease = () => {
  const increase = ((targetYield.value - districtAverage.value) / districtAverage.value) * 100;
  return Math.round(increase);
};

const getReducedNitrogen = () => {
  const blanketN = store.blanketDose.n;
  const siteSpecificN = store.siteSpecificDose.n;
  return Math.max(0, blanketN - siteSpecificN);
};

const getCo2Saved = () => {
  // Approximate: 1 kg N fertilizer = 5.8 kg CO2 emissions
  return Math.round(getReducedNitrogen() * 5.8);
};
</script>

<style scoped>
.roi-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.roi-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  text-align: center;
  transition: transform 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.metric-icon {
  font-size: 2.5rem;
}

.yield-comparison {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: linear-gradient(135deg, rgba(27, 67, 50, 0.03), rgba(255, 183, 3, 0.03));
  border-radius: var(--radius-lg);
}

.comparison-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.comparison-label {
  display: flex;
  flex-direction: column;
}

.comparison-bar-container {
  width: 100%;
}

.comparison-bar {
  height: 50px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  transition: width 0.6s ease-out;
  min-width: 100px;
}

.bar-district {
  background: linear-gradient(90deg, var(--earth-gray), var(--soil-brown));
}

.bar-soilsense {
  background: linear-gradient(90deg, var(--forest-green-light), var(--forest-green));
}

.bar-label {
  color: white;
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.yield-gap-info {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: white;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--forest-green);
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.fue-section {
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.fue-comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-6);
  align-items: center;
  margin-bottom: var(--space-4);
}

.fue-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.fue-gauge {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.gauge-background {
  width: 100%;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  transition: width 0.6s ease-out;
  border-radius: var(--radius-md);
}

.fue-blanket {
  background-color: var(--clay-red);
}

.fue-soilsense {
  background-color: var(--forest-green);
}

.fue-arrow {
  font-size: 2rem;
  color: var(--sunlit-amber);
  font-weight: 700;
}

.fue-explanation {
  padding: var(--space-4);
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-md);
}

.environmental-impact {
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  background: linear-gradient(135deg, rgba(27, 67, 50, 0.05), rgba(45, 106, 79, 0.05));
  border-radius: var(--radius-lg);
}

.impact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-4);
}

.impact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: white;
  border-radius: var(--radius-md);
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .fue-comparison {
    grid-template-columns: 1fr;
  }
  
  .fue-arrow {
    transform: rotate(90deg);
  }
}
</style>
