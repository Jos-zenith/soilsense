<template>
  <div class="yield-slider bento-card">
    <div class="card-header">
      <h3 class="text-xl font-semibold">
        <span class="icon-measure"></span> இலக்கு விளைச்சல்
      </h3>
      <span class="text-sm text-earth-gray">Target Yield Calculator</span>
    </div>
    
    <div class="slider-container">
      <div class="yield-display">
        <div class="yield-value">
          <span class="value-number text-4xl font-bold text-forest-green">
            {{ targetYield }}
          </span>
          <span class="value-unit text-xl text-earth-gray">tonnes/ha</span>
        </div>
        <p class="text-sm text-earth-gray">
          நீங்கள் விரும்பும் விளைச்சல் அளவு
        </p>
      </div>
      
      <div class="slider-control">
        <input 
          type="range" 
          :value="targetYield"
          @input="updateYield"
          min="3" 
          max="15" 
          step="0.5"
          class="yield-range"
        />
        <div class="slider-labels">
          <span class="text-xs text-earth-gray">3 tonnes</span>
          <span class="text-xs text-earth-gray">15 tonnes</span>
        </div>
      </div>
    </div>
    
    <!-- STCR Formula Visualization -->
    <div v-if="sensorData" class="stcr-formula">
      <div class="formula-header">
        <h4 class="text-sm font-semibold text-forest-green">
          📊 STCR-IPNS Calculation
        </h4>
        <p class="text-xs text-earth-gray">
          Site-specific fertilizer prescription
        </p>
      </div>
      
      <div class="formula-breakdown">
        <!-- Nitrogen Formula -->
        <div class="formula-item">
          <div class="formula-label">Nitrogen (N)</div>
          <div class="formula-equation text-sm">
            FN = 4.33 × <span class="highlight">{{ targetYield }}</span> 
            - 0.53 × {{ soilNitrogen }} 
            - 0.68 × {{ organicNitrogen }}
          </div>
          <div class="formula-result">
            = <span class="result-value text-forest-green">{{ dose.n }} kg/ha</span>
          </div>
        </div>
        
        <!-- Phosphorus Formula -->
        <div class="formula-item">
          <div class="formula-label">Phosphorus (P)</div>
          <div class="formula-equation text-sm">
            FP = 5.64 × <span class="highlight">{{ targetYield }}</span> 
            - 2.42 × {{ soilPhosphorus }} 
            - 1.23 × {{ organicPhosphorus }}
          </div>
          <div class="formula-result">
            = <span class="result-value text-forest-green">{{ dose.p }} kg/ha</span>
          </div>
        </div>
        
        <!-- Potassium Formula -->
        <div class="formula-item">
          <div class="formula-label">Potassium (K)</div>
          <div class="formula-equation text-sm">
            FK = 3.75 × <span class="highlight">{{ targetYield }}</span> 
            - 0.26 × {{ soilPotassium }} 
            - 0.53 × {{ organicPotassium }}
          </div>
          <div class="formula-result">
            = <span class="result-value text-forest-green">{{ dose.k }} kg/ha</span>
          </div>
        </div>
      </div>
      
      <!-- NPK Summary -->
      <div class="npk-summary">
        <div class="summary-card">
          <div class="summary-icon">N</div>
          <div class="summary-value">{{ dose.n }} kg</div>
          <div class="summary-label">Nitrogen</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">P</div>
          <div class="summary-value">{{ dose.p }} kg</div>
          <div class="summary-label">Phosphorus</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">K</div>
          <div class="summary-value">{{ dose.k }} kg</div>
          <div class="summary-label">Potassium</div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-message text-sm text-earth-gray">
      ⚠️ Connect sensors to calculate site-specific fertilizer doses
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '../../stores/appStore';

const store = useAppStore();

const targetYield = computed(() => store.targetYield);
const sensorData = computed(() => store.sensorData);
const dose = computed(() => store.siteSpecificDose);

// Soil nutrient availability (defaults or from sensor)
const soilNitrogen = computed(() => sensorData.value?.nitrogen || 180);
const soilPhosphorus = computed(() => sensorData.value?.phosphorus || 15);
const soilPotassium = computed(() => sensorData.value?.potassium || 250);

// Organic manure contribution (can be made dynamic)
const organicNitrogen = ref(0);
const organicPhosphorus = ref(0);
const organicPotassium = ref(0);

const updateYield = (event: Event) => {
  const target = event.target as HTMLInputElement;
  store.setTargetYield(parseFloat(target.value));
};
</script>

<style scoped>
.yield-slider {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  height: 100%;
}

.card-header {
  flex-shrink: 0;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1;
  justify-content: center;
}

.yield-display {
  text-align: center;
  padding: var(--space-6);
  background: linear-gradient(135deg, rgba(27, 67, 50, 0.1), rgba(255, 183, 3, 0.1));
  border-radius: var(--radius-lg);
}

.yield-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-3);
}

.slider-control {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.yield-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 12px;
  border-radius: var(--radius-md);
  background: linear-gradient(to right, var(--forest-green), var(--sunlit-amber));
  outline: none;
  cursor: pointer;
}

.yield-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 3px solid var(--forest-green);
}

.yield-range::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 3px solid var(--forest-green);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 var(--space-2);
}

.stcr-formula {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: rgba(27, 67, 50, 0.03);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--forest-green);
  flex-shrink: 0;
}

.empty-message {
  text-align: center;
  padding: var(--space-6);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--earth-gray);
}

.formula-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.formula-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.formula-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background-color: white;
  border-radius: var(--radius-sm);
}

.formula-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--earth-gray);
}

.formula-equation {
  font-family: 'Courier New', monospace;
  color: var(--earth-dark);
}

.highlight {
  color: var(--sunlit-amber-dark);
  font-weight: 700;
  padding: 0 var(--space-1);
  background-color: rgba(255, 183, 3, 0.1);
  border-radius: var(--radius-sm);
}

.formula-result {
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

.result-value {
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.npk-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.summary-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--forest-green);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.summary-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--forest-green);
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--earth-gray);
}

.empty-message {
  text-align: center;
  padding: var(--space-6);
}
</style>
