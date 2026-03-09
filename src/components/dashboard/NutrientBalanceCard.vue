<template>
  <div class="nutrient-balance bento-card">
    <div class="card-header">
      <div>
        <h3 class="text-xl font-semibold">
          ⚖️ ஊட்டச்சத்து சமநிலை பட்டியல்
        </h3>
        <span class="text-sm text-earth-gray">Nutrient Balance Sheet (STCR-IPNS)</span>
      </div>
    </div>
    
    <div v-if="!sensorData" class="empty-message text-sm text-earth-gray">
      ⚠️ Connect sensors to visualize nutrient balance
    </div>
    
    <div v-else class="nutrient-content">
      <!-- Legend -->
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color" style="background-color: var(--soil-brown);"></span>
          <span class="legend-label text-sm">Soil Contribution</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background-color: var(--sunlit-amber);"></span>
          <span class="legend-label text-sm">Organic Manure (FYM)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background-color: var(--clay-red);"></span>
          <span class="legend-label text-sm">Chemical Fertilizer Gap</span>
        </div>
      </div>
      
      <!-- Bar Charts -->
      <div class="nutrient-charts">
        <!-- Nitrogen Chart -->
        <div class="nutrient-chart-item">
          <div class="chart-header">
            <div class="nutrient-name">
              <span class="nutrient-icon">N</span>
              <span class="font-medium">Nitrogen</span>
            </div>
            <div class="chart-total text-sm font-semibold">
              Total Need: {{ getNitrogenRequirement() }} kg/ha
            </div>
          </div>
          
          <div class="stacked-bar">
            <div 
              class="bar-segment soil-segment"
              :style="{ width: getNitrogenSoilPercentage() + '%' }"
              :title="`Soil: ${getNitrogenFromSoil()} kg`"
            >
              <span v-if="getNitrogenSoilPercentage() > 15" class="segment-value">
                {{ getNitrogenFromSoil() }} kg
              </span>
            </div>
            <div 
              class="bar-segment organic-segment"
              :style="{ width: getNitrogenOrganicPercentage() + '%' }"
              :title="`Organic: ${getNitrogenFromOrganic()} kg`"
            >
              <span v-if="getNitrogenOrganicPercentage() > 15" class="segment-value">
                {{ getNitrogenFromOrganic() }} kg
              </span>
            </div>
            <div 
              class="bar-segment chemical-segment"
              :style="{ width: getNitrogenChemicalPercentage() + '%' }"
              :title="`Chemical Gap: ${siteSpecificDose.n} kg`"
            >
              <span v-if="getNitrogenChemicalPercentage() > 15" class="segment-value">
                {{ siteSpecificDose.n }} kg
              </span>
            </div>
          </div>
          
          <div class="bar-breakdown text-xs">
            <span>Soil: {{ getNitrogenFromSoil() }} kg ({{ Math.round(getNitrogenSoilPercentage()) }}%)</span>
            <span>Organic: {{ getNitrogenFromOrganic() }} kg ({{ Math.round(getNitrogenOrganicPercentage()) }}%)</span>
            <span class="text-clay-red font-medium">Chemical Need: {{ siteSpecificDose.n }} kg ({{ Math.round(getNitrogenChemicalPercentage()) }}%)</span>
          </div>
        </div>
        
        <!-- Phosphorus Chart -->
        <div class="nutrient-chart-item">
          <div class="chart-header">
            <div class="nutrient-name">
              <span class="nutrient-icon">P</span>
              <span class="font-medium">Phosphorus</span>
            </div>
            <div class="chart-total text-sm font-semibold">
              Total Need: {{ getPhosphorusRequirement() }} kg/ha
            </div>
          </div>
          
          <div class="stacked-bar">
            <div 
              class="bar-segment soil-segment"
              :style="{ width: getPhosphorusSoilPercentage() + '%' }"
            >
              <span v-if="getPhosphorusSoilPercentage() > 15" class="segment-value">
                {{ getPhosphorusFromSoil() }} kg
              </span>
            </div>
            <div 
              class="bar-segment organic-segment"
              :style="{ width: getPhosphorusOrganicPercentage() + '%' }"
            >
              <span v-if="getPhosphorusOrganicPercentage() > 15" class="segment-value">
                {{ getPhosphorusFromOrganic() }} kg
              </span>
            </div>
            <div 
              class="bar-segment chemical-segment"
              :style="{ width: getPhosphorusChemicalPercentage() + '%' }"
            >
              <span v-if="getPhosphorusChemicalPercentage() > 15" class="segment-value">
                {{ siteSpecificDose.p }} kg
              </span>
            </div>
          </div>
          
          <div class="bar-breakdown text-xs">
            <span>Soil: {{ getPhosphorusFromSoil() }} kg ({{ Math.round(getPhosphorusSoilPercentage()) }}%)</span>
            <span>Organic: {{ getPhosphorusFromOrganic() }} kg ({{ Math.round(getPhosphorusOrganicPercentage()) }}%)</span>
            <span class="text-clay-red font-medium">Chemical Need: {{ siteSpecificDose.p }} kg ({{ Math.round(getPhosphorusChemicalPercentage()) }}%)</span>
          </div>
        </div>
        
        <!-- Potassium Chart -->
        <div class="nutrient-chart-item">
          <div class="chart-header">
            <div class="nutrient-name">
              <span class="nutrient-icon">K</span>
              <span class="font-medium">Potassium</span>
            </div>
            <div class="chart-total text-sm font-semibold">
              Total Need: {{ getPotassiumRequirement() }} kg/ha
            </div>
          </div>
          
          <div class="stacked-bar">
            <div 
              class="bar-segment soil-segment"
              :style="{ width: getPotassiumSoilPercentage() + '%' }"
            >
              <span v-if="getPotassiumSoilPercentage() > 15" class="segment-value">
                {{ getPotassiumFromSoil() }} kg
              </span>
            </div>
            <div 
              class="bar-segment organic-segment"
              :style="{ width: getPotassiumOrganicPercentage() + '%' }"
            >
              <span v-if="getPotassiumOrganicPercentage() > 15" class="segment-value">
                {{ getPotassiumFromOrganic() }} kg
              </span>
            </div>
            <div 
              class="bar-segment chemical-segment"
              :style="{ width: getPotassiumChemicalPercentage() + '%' }"
            >
              <span v-if="getPotassiumChemicalPercentage() > 15" class="segment-value">
                {{ siteSpecificDose.k }} kg
              </span>
            </div>
          </div>
          
          <div class="bar-breakdown text-xs">
            <span>Soil: {{ getPotassiumFromSoil() }} kg ({{ Math.round(getPotassiumSoilPercentage()) }}%)</span>
            <span>Organic: {{ getPotassiumFromOrganic() }} kg ({{ Math.round(getPotassiumOrganicPercentage()) }}%)</span>
            <span class="text-clay-red font-medium">Chemical Need: {{ siteSpecificDose.k }} kg ({{ Math.round(getPotassiumChemicalPercentage()) }}%)</span>
          </div>
        </div>
      </div>
      
      <!-- Economic Logic Statement -->
      <div class="economic-statement">
        <div class="statement-icon">💡</div>
        <div class="statement-content">
          <h4 class="text-sm font-semibold text-forest-green">
            Economic Logic - பொருளாதார தர்க்கம்
          </h4>
          <p class="text-sm">
            Adding <strong>Farm Yard Manure (FYM)</strong> reduces your chemical fertilizer needs. 
            The <strong class="text-clay-red">red bars shrink</strong> in real-time as you add organic inputs, 
            demonstrating immediate cost savings and sustainable farming practices.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../../stores/appStore';

const store = useAppStore();

const sensorData = computed(() => store.sensorData);
const siteSpecificDose = computed(() => store.siteSpecificDose);
const targetYield = computed(() => store.targetYield);

// STCR coefficients
const STCR_COEFFICIENTS = {
  n: { yield: 4.33, soil: 0.53, organic: 0.68 },
  p: { yield: 5.64, soil: 2.42, organic: 1.23 },
  k: { yield: 3.75, soil: 0.26, organic: 0.53 }
};

// Nitrogen calculations
const getNitrogenRequirement = () => Math.round(STCR_COEFFICIENTS.n.yield * targetYield.value);
const getNitrogenFromSoil = () => Math.round(STCR_COEFFICIENTS.n.soil * (sensorData.value?.nitrogen || 180));
const getNitrogenFromOrganic = () => 0; // Can be made dynamic
const getNitrogenSoilPercentage = () => (getNitrogenFromSoil() / getNitrogenRequirement()) * 100;
const getNitrogenOrganicPercentage = () => (getNitrogenFromOrganic() / getNitrogenRequirement()) * 100;
const getNitrogenChemicalPercentage = () => (siteSpecificDose.value.n / getNitrogenRequirement()) * 100;

// Phosphorus calculations
const getPhosphorusRequirement = () => Math.round(STCR_COEFFICIENTS.p.yield * targetYield.value);
const getPhosphorusFromSoil = () => Math.round(STCR_COEFFICIENTS.p.soil * (sensorData.value?.phosphorus || 15));
const getPhosphorusFromOrganic = () => 0;
const getPhosphorusSoilPercentage = () => (getPhosphorusFromSoil() / getPhosphorusRequirement()) * 100;
const getPhosphorusOrganicPercentage = () => (getPhosphorusFromOrganic() / getPhosphorusRequirement()) * 100;
const getPhosphorusChemicalPercentage = () => (siteSpecificDose.value.p / getPhosphorusRequirement()) * 100;

// Potassium calculations
const getPotassiumRequirement = () => Math.round(STCR_COEFFICIENTS.k.yield * targetYield.value);
const getPotassiumFromSoil = () => Math.round(STCR_COEFFICIENTS.k.soil * (sensorData.value?.potassium || 250));
const getPotassiumFromOrganic = () => 0;
const getPotassiumSoilPercentage = () => (getPotassiumFromSoil() / getPotassiumRequirement()) * 100;
const getPotassiumOrganicPercentage = () => (getPotassiumFromOrganic() / getPotassiumRequirement()) * 100;
const getPotassiumChemicalPercentage = () => (siteSpecificDose.value.k / getPotassiumRequirement()) * 100;
</script>

<style scoped>
.nutrient-balance {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.empty-message {
  text-align: center;
  padding: var(--space-8);
}

.nutrient-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.legend {
  display: flex;
  gap: var(--space-6);
  flex-wrap: wrap;
  padding: var(--space-4);
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
}

.nutrient-charts {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.nutrient-chart-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.nutrient-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nutrient-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--forest-green);
  color: white;
  border-radius: 50%;
  font-weight: 700;
}

.stacked-bar {
  display: flex;
  width: 100%;
  height: 60px;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s ease-out;
  position: relative;
}

.soil-segment {
  background-color: var(--soil-brown);
}

.organic-segment {
  background-color: var(--sunlit-amber);
}

.chemical-segment {
  background-color: var(--clay-red);
}

.segment-value {
  color: white;
  font-weight: 700;
  font-size: var(--font-size-sm);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.bar-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);
  color: var(--earth-gray);
}

.economic-statement {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-6);
  background: linear-gradient(135deg, rgba(27, 67, 50, 0.05), rgba(255, 183, 3, 0.05));
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--sunlit-amber);
}

.statement-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.statement-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
