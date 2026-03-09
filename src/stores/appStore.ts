/**
 * Main Application Store - Pinia
 * Manages state for crop recommendations, sensor data, and economic calculations
 */

import { defineStore } from 'pinia';
import type { SensorData, CropData, CropRecommendation } from '../types/crop';
import { cropDatabase } from '../services/cropDatabase';
import { CropRecommendationEngine } from '../services/recommendationEngine';

export const useAppStore = defineStore('app', {
  state: () => ({
    // Sensor Data
    sensorData: null as SensorData | null,
    mqttConnected: false,
    
    // Crop Recommendations
    recommendations: [] as CropRecommendation[],
    engine: new CropRecommendationEngine(cropDatabase),
    
    // Target Yield (user input)
    targetYield: 7, // tonnes/ha - default
    
    // Economic Data
    blanketDose: {
      n: 150,
      p: 50,
      k: 50,
      cost: 0
    },
    siteSpecificDose: {
      n: 0,
      p: 0,
      k: 0,
      cost: 0
    },
    
    // Fertilizer Prices (₹ per kg)
    fertilizerPrices: {
      urea: 6.5,        // N source
      dap: 27,          // P source
      mop: 18,          // K source
      fym: 1            // Farm Yard Manure per kg
    },
    
    // District Average Yields (tonnes/ha)
    districtAverages: {
      paddy: 4.5,
      maize: 5.2,
      cotton: 2.1,
      sugarcane: 85,
      tomato: 25
    }
  }),
  
  getters: {
    /**
     * Get top 5 crop recommendations
     */
    topRecommendations: (state) => {
      return state.recommendations.slice(0, 5);
    },
    
    /**
     * Crops with 90%+ match (Golden Border candidates)
     */
    excellentMatches: (state) => {
      return state.recommendations.filter(rec => rec.matchScore >= 90);
    },
    
    /**
     * Calculate savings from STCR vs Blanket Dose
     */
    moneySaved: (state) => {
      const blanketCost = 
        (state.blanketDose.n / 46 * state.fertilizerPrices.urea) + // Urea is 46% N
        (state.blanketDose.p / 18 * state.fertilizerPrices.dap) +   // DAP is 18% P
        (state.blanketDose.k / 50 * state.fertilizerPrices.mop);    // MOP is 50% K
      
      const siteSpecificCost = 
        (state.siteSpecificDose.n / 46 * state.fertilizerPrices.urea) +
        (state.siteSpecificDose.p / 18 * state.fertilizerPrices.dap) +
        (state.siteSpecificDose.k / 50 * state.fertilizerPrices.mop);
      
      state.blanketDose.cost = Math.round(blanketCost);
      state.siteSpecificDose.cost = Math.round(siteSpecificCost);
      
      return Math.round(blanketCost - siteSpecificCost);
    },
    
    /**
     * Fertilizer Use Efficiency (FUE) calculation
     */
    fertilizerEfficiency: (state) => {
      // Blanket dose typically has 30% FUE
      const blanketFUE = 30;
      
      // Site-specific can achieve 55-65% FUE
      const siteSpecificFUE = state.sensorData ? 60 : 30;
      
      return {
        blanket: blanketFUE,
        siteSpecific: siteSpecificFUE,
        improvement: siteSpecificFUE - blanketFUE
      };
    },
    
    /**
     * Check if pH is in danger zone
     */
    phStatus: (state) => {
      if (!state.sensorData) return 'unknown';
      const ph = state.sensorData.soil_ph;
      
      if (ph < 5.5) return 'danger-acidic';
      if (ph > 8.5) return 'danger-alkaline';
      if (ph >= 6.0 && ph <= 7.5) return 'optimal';
      return 'caution';
    }
  },
  
  actions: {
    /**
     * Update sensor data from MQTT
     */
    updateSensorData(data: SensorData) {
      this.sensorData = {
        ...data,
        timestamp: new Date()
      };
      
      // Auto-trigger recommendations
      this.getRecommendations();
    },
    
    /**
     * Set MQTT connection status
     */
    setMQTTConnection(connected: boolean) {
      this.mqttConnected = connected;
    },
    
    /**
     * Get crop recommendations based on current sensor data
     */
    getRecommendations() {
      if (!this.sensorData) return;
      
      this.recommendations = this.engine.getRecommendations(this.sensorData);
      
      // Calculate site-specific dose for top crop
      if (this.recommendations.length > 0 && this.recommendations[0]) {
        this.calculateSTCRDose(this.recommendations[0].crop);
      }
    },
    
    /**
     * Calculate STCR-IPNS fertilizer dose
     * Formula: FN = 4.33*T - 0.53*SN - 0.68*ON
     * FP = 5.64*T - 2.42*SP - 1.23*OP
     * FK = 3.75*T - 0.26*SK - 0.53*OK
     */
    calculateSTCRDose(_crop: CropData, organicManure: number = 0) {
      if (!this.sensorData) return;
      
      const T = this.targetYield; // Target yield in tonnes/ha
      const SN = this.sensorData.nitrogen || 180; // Soil nitrogen (default)
      const SP = this.sensorData.phosphorus || 15;
      const SK = this.sensorData.potassium || 250;
      
      // Organic manure contribution (if FYM applied)
      const ON = organicManure * 0.5; // 0.5% N in FYM
      const OP = organicManure * 0.2; // 0.2% P in FYM
      const OK = organicManure * 0.5; // 0.5% K in FYM
      
      // STCR Equations for Paddy (can be customized per crop)
      let FN = 4.33 * T - 0.53 * SN - 0.68 * ON;
      let FP = 5.64 * T - 2.42 * SP - 1.23 * OP;
      let FK = 3.75 * T - 0.26 * SK - 0.53 * OK;
      
      // Ensure non-negative values
      FN = Math.max(0, FN);
      FP = Math.max(0, FP);
      FK = Math.max(0, FK);
      
      this.siteSpecificDose = {
        n: Math.round(FN),
        p: Math.round(FP),
        k: Math.round(FK),
        cost: 0 // Will be calculated by getter
      };
    },
    
    /**
     * Update target yield
     */
    setTargetYield(yield_tonnes: number) {
      this.targetYield = yield_tonnes;
      
      // Recalculate doses
      if (this.recommendations.length > 0 && this.recommendations[0]) {
        this.calculateSTCRDose(this.recommendations[0].crop);
      }
    },
    
    /**
     * Get Tamil recommendation text for voice output
     */
    getTamilRecommendation(): string {
      if (this.recommendations.length === 0 || !this.recommendations[0]) {
        return 'தற்போது பயிர் பரிந்துரைகள் இல்லை';
      }
      
      const top = this.recommendations[0];
      return `உங்கள் மண் ${top.crop.cropNameTA} பயிருக்கு ${top.matchScore} சதவீதம் பொருந்தும். ${top.crop.fertilizerActionTA}`;
    }
  }
});
