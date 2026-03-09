<template>
  <div class="money-saved bento-card">
    <div class="card-header">
      <h3 class="text-xl font-semibold">
        💰 சேமித்த பணம்
      </h3>
      <span class="text-sm text-earth-gray">Money Saved Analysis</span>
    </div>
    
    <div v-if="!sensorData" class="empty-message text-sm text-earth-gray">
      ⚠️ Connect sensors to see savings calculation
    </div>
    
    <div v-else class="savings-content">
      <!-- Main Savings Display -->
      <div class="savings-hero">
        <div class="savings-label text-sm text-earth-gray">
          Potential Savings per Hectare
        </div>
        <div class="savings-amount">
          <span class="currency">₹</span>
          <span class="amount text-4xl font-bold text-forest-green">
            {{ Math.abs(moneySaved).toLocaleString('en-IN') }}
          </span>
        </div>
        <div class="savings-status">
          <span v-if="moneySaved > 0" class="status-positive">
            ✅ You save money with SoilSense!
          </span>
          <span v-else class="status-negative">
            ⚠️ Additional fertilizer needed for target yield
          </span>
        </div>
      </div>
      
      <!-- Comparison Chart -->
      <div class="comparison-chart">
        <div class="chart-title text-sm font-semibold text-earth-gray">
          Fertilizer Cost Comparison
        </div>
        
        <div class="chart-bars">
          <!-- Blanket Dose Bar -->
          <div class="chart-item">
            <div class="chart-label">
              <span class="label-text text-sm">Blanket Dose</span>
              <span class="label-subtitle text-xs text-earth-gray">
                பொது பரிந்துரை
              </span>
            </div>
            <div class="chart-bar-container">
              <div 
                class="chart-bar bar-blanket"
                :style="{ width: blanketPercentage + '%' }"
              >
                <span class="bar-value">₹{{ blanketDose.cost }}</span>
              </div>
            </div>
          </div>
          
          <!-- SoilSense Dose Bar -->
          <div class="chart-item">
            <div class="chart-label">
              <span class="label-text text-sm">SoilSense Prescribed</span>
              <span class="label-subtitle text-xs text-earth-gray">
                மண் அடிப்படை பரிந்துரை
              </span>
            </div>
            <div class="chart-bar-container">
              <div 
                class="chart-bar bar-soilsense"
                :style="{ width: siteSpecificPercentage + '%' }"
              >
                <span class="bar-value">₹{{ siteSpecificDose.cost }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- NPK Breakdown -->
      <div class="npk-breakdown">
        <div class="breakdown-title text-sm font-semibold text-earth-gray">
          NPK Dose Comparison (kg/ha)
        </div>
        
        <div class="breakdown-table">
          <div class="breakdown-row breakdown-header">
            <div class="breakdown-cell">Nutrient</div>
            <div class="breakdown-cell">Blanket</div>
            <div class="breakdown-cell">SoilSense</div>
            <div class="breakdown-cell">Difference</div>
          </div>
          
          <div class="breakdown-row">
            <div class="breakdown-cell nutrient-label">
              <span class="nutrient-icon">N</span> Nitrogen
            </div>
            <div class="breakdown-cell">{{ blanketDose.n }} kg</div>
            <div class="breakdown-cell text-forest-green font-medium">
              {{ siteSpecificDose.n }} kg
            </div>
            <div class="breakdown-cell" :class="getDifferenceClass(blanketDose.n - siteSpecificDose.n)">
              {{ formatDifference(blanketDose.n - siteSpecificDose.n) }} kg
            </div>
          </div>
          
          <div class="breakdown-row">
            <div class="breakdown-cell nutrient-label">
              <span class="nutrient-icon">P</span> Phosphorus
            </div>
            <div class="breakdown-cell">{{ blanketDose.p }} kg</div>
            <div class="breakdown-cell text-forest-green font-medium">
              {{ siteSpecificDose.p }} kg
            </div>
            <div class="breakdown-cell" :class="getDifferenceClass(blanketDose.p - siteSpecificDose.p)">
              {{ formatDifference(blanketDose.p - siteSpecificDose.p) }} kg
            </div>
          </div>
          
          <div class="breakdown-row">
            <div class="breakdown-cell nutrient-label">
              <span class="nutrient-icon">K</span> Potassium
            </div>
            <div class="breakdown-cell">{{ blanketDose.k }} kg</div>
            <div class="breakdown-cell text-forest-green font-medium">
              {{ siteSpecificDose.k }} kg
            </div>
            <div class="breakdown-cell" :class="getDifferenceClass(blanketDose.k - siteSpecificDose.k)">
              {{ formatDifference(blanketDose.k - siteSpecificDose.k) }} kg
            </div>
          </div>
        </div>
      </div>
      
      <!-- Economic Impact Statement -->
      <div class="impact-statement">
        <div class="impact-icon">📊</div>
        <p class="impact-text text-sm">
          By using <strong>site-specific fertilizer recommendations</strong>, 
          you can {{ moneySaved > 0 ? 'save' : 'invest an additional' }} 
          <strong class="text-forest-green">₹{{ Math.abs(moneySaved).toLocaleString('en-IN') }}</strong> 
          per hectare while achieving your target yield of 
          <strong class="text-sunlit-amber">{{ targetYield }} tonnes/ha</strong>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../../stores/appStore';

const store = useAppStore();

const sensorData = computed(() => store.sensorData);
const moneySaved = computed(() => store.moneySaved);
const blanketDose = computed(() => store.blanketDose);
const siteSpecificDose = computed(() => store.siteSpecificDose);
const targetYield = computed(() => store.targetYield);

const blanketPercentage = computed(() => {
  const maxCost = Math.max(blanketDose.value.cost, siteSpecificDose.value.cost);
  return maxCost > 0 ? (blanketDose.value.cost / maxCost) * 100 : 0;
});

const siteSpecificPercentage = computed(() => {
  const maxCost = Math.max(blanketDose.value.cost, siteSpecificDose.value.cost);
  return maxCost > 0 ? (siteSpecificDose.value.cost / maxCost) * 100 : 0;
});

const getDifferenceClass = (diff: number): string => {
  if (diff > 0) return 'text-forest-green'; // Saving
  if (diff < 0) return 'text-clay-red';     // Need more
  return 'text-earth-gray';
};

const formatDifference = (diff: number): string => {
  if (diff > 0) return `-${diff}`; // Reduction
  if (diff < 0) return `+${Math.abs(diff)}`; // Increase needed
  return '0';
};
</script>

<style scoped>
.money-saved {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}

.empty-message {
  text-align: center;
  padding: var(--space-6);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.savings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1;
  overflow-y: auto;
  max-height: none;
  min-height: 0;
}

.savings-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5);
  background: linear-gradient(135deg, rgba(27, 67, 50, 0.1), rgba(255, 183, 3, 0.1));
  border-radius: var(--radius-md);
  text-align: center;
}

.savings-amount {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.currency {
  font-size: var(--font-size-2xl);
  color: var(--earth-gray);
}

.status-positive {
  color: var(--forest-green);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.status-negative {
  color: var(--clay-red);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.comparison-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.chart-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.chart-label {
  display: flex;
  flex-direction: column;
}

.chart-bar-container {
  width: 100%;
  position: relative;
}

.chart-bar {
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--space-3);
  transition: width 0.6s ease-out;
  min-width: 80px;
}

.bar-blanket {
  background: linear-gradient(90deg, var(--clay-red-light), var(--clay-red));
}

.bar-soilsense {
  background: linear-gradient(90deg, var(--forest-green-light), var(--forest-green));
}

.bar-value {
  color: white;
  font-weight: 600;
  font-size: var(--font-size-base);
}

.npk-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.breakdown-table {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.breakdown-row {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr 0.9fr 1fr;
  gap: var(--space-1);
}

.breakdown-header {
  background-color: var(--forest-green);
  color: white;
  font-weight: 600;
}

.breakdown-row:not(.breakdown-header) {
  background-color: white;
}

.breakdown-row:not(.breakdown-header):nth-child(even) {
  background-color: rgba(0, 0, 0, 0.02);
}

.breakdown-cell {
  padding: var(--space-2);
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
}

.nutrient-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 500;
}

.nutrient-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: var(--forest-green);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: var(--font-size-xs);
}

.impact-statement {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: rgba(27, 67, 50, 0.05);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--forest-green);
}

.impact-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.impact-text {
  line-height: var(--leading-relaxed);
}

/* Responsive */
@media (max-width: 640px) {
  .breakdown-row {
    grid-template-columns: 1fr;
  }
  
  .breakdown-header {
    display: none;
  }
  
  .breakdown-cell::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: var(--space-2);
  }
  
  .savings-content {
    max-height: 400px;
  }
  
  .chart-bar {
    height: 36px;
  }
  
  .savings-hero {
    padding: var(--space-4);
  }
}
</style>
