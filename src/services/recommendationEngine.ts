import type {
  CropData,
  SensorData,
  CropRecommendation,
  FertilizerRecommendation,
} from '../types/crop';
import { cropDatabase } from './cropDatabase';

/**
 * Main recommendation engine that matches sensor data to suitable crops
 */
export class CropRecommendationEngine {
  private cropDatabase: CropData[];

  constructor(database: CropData[] = cropDatabase) {
    this.cropDatabase = database;
  }

  /**
   * Get crop recommendations based on sensor input
   */
  getRecommendations(sensorData: SensorData): CropRecommendation[] {
    const recommendations = this.cropDatabase
      .map((crop) => ({
        crop,
        matchScore: this.calculateMatchScore(crop, sensorData),
        reasons: this.getMatchReasons(crop, sensorData),
        actionRequired: this.getRequiredActions(crop, sensorData),
      }))
      .filter((rec) => rec.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    return recommendations;
  }

  /**
   * Calculate match score (0-100) based on how well sensor data matches crop requirements
   */
  private calculateMatchScore(crop: CropData, sensor: SensorData): number {
    let score = 0;
    const weights = {
      ph: 0.25,
      temp: 0.25,
      soilType: 0.2,
      water: 0.3, // Higher weight for water/moisture
    };

    // pH matching (within range = full points)
    const phScore = this.getRangeMatchScore(
      sensor.soil_ph,
      crop.phRange.min,
      crop.phRange.max,
      0.5 // tolerance: ±0.5 pH points
    );
    score += phScore * weights.ph;

    // Temperature matching
    const tempScore = this.getRangeMatchScore(
      sensor.temperature,
      crop.tempRange.min,
      crop.tempRange.max,
      2 // tolerance: ±2°C
    );
    score += tempScore * weights.temp;

    // Soil type matching (simple string match)
    const soilScore = this.getSoilTypeMatchScore(
      sensor.soil_type.toLowerCase(),
      crop.soilTypeEN.toLowerCase(),
      crop.soilTypeTA.toLowerCase()
    );
    score += soilScore * weights.soilType;

    // Water requirement (moisture should be present but not overly high)
    const waterScore = this.getWaterMatchScore(
      sensor.moisture,
      crop.waterRequirement
    );
    score += waterScore * weights.water;

    return Math.round(score);
  }

  /**
   * Score for range-based parameters (pH, Temperature)
   * Returns 100 if within range, decreases based on distance from range
   */
  private getRangeMatchScore(
    value: number,
    min: number,
    max: number,
    tolerance: number = 0
  ): number {
    const targetMin = min - tolerance;
    const targetMax = max + tolerance;

    if (value >= min && value <= max) {
      return 100; // Perfect match
    }

    if (value >= targetMin && value <= targetMax) {
      return 75; // Acceptable with tolerance
    }

    if (value < targetMin) {
      const distance = targetMin - value;
      return Math.max(0, 75 - distance * 10);
    }

    const distance = value - targetMax;
    return Math.max(0, 75 - distance * 10);
  }

  /**
   * Score for soil type matching
   */
  private getSoilTypeMatchScore(
    sensorSoil: string,
    englishType: string,
    tamilType: string
  ): number {
    if (
      sensorSoil.includes(englishType.toLowerCase()) ||
      sensorSoil.includes(tamilType.toLowerCase())
    ) {
      return 100;
    }

    // Partial matches for soil types
    const soilAliases: { [key: string]: string[] } = {
      clay: ['clayey', 'heavy', 'களிமண்'],
      loam: ['sandy loam', 'silt loam', 'வண்டல்'],
      sandy: ['light', 'well-draining', 'மணல்'],
    };

    for (const [keyword, aliases] of Object.entries(soilAliases)) {
      // Check if sensor soil matches the keyword or any of its aliases
      if (sensorSoil.includes(keyword)) return 70;
      
      for (const alias of aliases) {
        if (sensorSoil.includes(alias.toLowerCase())) return 70;
      }
      
      // Check crop soil types
      const typeWords = [...englishType.split(/\s+/), ...tamilType.split(/\s+/)];
      for (const type of typeWords) {
        if (type.toLowerCase().includes(keyword) || 
            aliases.some(a => type.toLowerCase().includes(a.toLowerCase()))) {
          return 70;
        }
      }
    }

    return 30; // Default partial match
  }

  /**
   * Score for water/moisture requirements
   * Based on ideal moisture level for the crop
   */
  private getWaterMatchScore(
    moistureLevel: number,
    waterRequirement: number
  ): number {
    // Assuming water requirement is in mm/season, normalize to percentage
    const requiredMoisture = (waterRequirement / 2000) * 100; // Normalize to ~0-100%

    if (moistureLevel >= requiredMoisture * 0.8 && moistureLevel <= requiredMoisture * 1.2) {
      return 100;
    }

    if (moistureLevel >= requiredMoisture * 0.6 && moistureLevel <= requiredMoisture * 1.4) {
      return 75;
    }

    const difference = Math.abs(moistureLevel - requiredMoisture);
    return Math.max(0, 100 - difference);
  }

  /**
   * Get reasons why a crop matches (or doesn't match) the sensor data
   */
  private getMatchReasons(crop: CropData, sensor: SensorData): string[] {
    const reasons: string[] = [];

    // pH analysis
    if (sensor.soil_ph >= crop.phRange.min && sensor.soil_ph <= crop.phRange.max) {
      reasons.push(`✓ pH level (${sensor.soil_ph}) is ideal for ${crop.cropNameEN}`);
    } else if (sensor.soil_ph < crop.phRange.min) {
      reasons.push(`⚠ Soil is too acidic (pH ${sensor.soil_ph}), ${crop.cropNameEN} prefers pH ${crop.phRange.min}-${crop.phRange.max}`);
    } else {
      reasons.push(`⚠ Soil is too alkaline (pH ${sensor.soil_ph}), ${crop.cropNameEN} prefers pH ${crop.phRange.min}-${crop.phRange.max}`);
    }

    // Temperature analysis
    if (
      sensor.temperature >= crop.tempRange.min &&
      sensor.temperature <= crop.tempRange.max
    ) {
      reasons.push(`✓ Temperature (${sensor.temperature}°C) is suitable for ${crop.cropNameEN}`);
    } else {
      reasons.push(`⚠ Temperature (${sensor.temperature}°C) is outside the ideal range (${crop.tempRange.min}-${crop.tempRange.max}°C) for ${crop.cropNameEN}`);
    }

    // Moisture analysis
    reasons.push(`✓ Soil moisture: ${sensor.moisture.toFixed(1)}mm`);

    return reasons;
  }

  /**
   * Get required actions/fertilizer recommendations
   */
  private getRequiredActions(crop: CropData, sensor: SensorData): string[] {
    const actions: string[] = [];

    // Fertilizer action
    actions.push(`Primary Fertilizer: ${crop.primaryFertilizer} (NPK Ratio)`);
    actions.push(`Action (TA): ${crop.fertilizerActionTA}`);
    actions.push(`Requirements: ${crop.fertilizerRequirementsEN}`);

    // Additional actions based on sensor data
    if (sensor.soil_ph < crop.phRange.min) {
      actions.push('Apply lime to increase soil pH');
    } else if (sensor.soil_ph > crop.phRange.max) {
      actions.push('Apply sulfur to decrease soil pH');
    }

    actions.push(`Micronutrients needed: ${crop.micronutrients}`);

    return actions;
  }

  /**
   * Get fertilizer recommendation for a specific crop
   */
  getFertilizerRecommendation(cropId: string): FertilizerRecommendation | null {
    const crop = this.cropDatabase.find((c) => c.id === cropId);
    if (!crop) return null;

    return {
      cropName: crop.cropNameEN,
      npkRatio: crop.primaryFertilizer,
      micronutrients: crop.micronutrients,
      actionTA: crop.fertilizerActionTA,
      actionEN: crop.fertilizerRequirementsEN,
    };
  }

  /**
   * Get all crops in database
   */
  getAllCrops(): CropData[] {
    return this.cropDatabase;
  }

  /**
   * Add or update a crop in the database
   */
  addCrop(crop: CropData): void {
    const index = this.cropDatabase.findIndex((c) => c.id === crop.id);
    if (index >= 0) {
      this.cropDatabase[index] = crop;
    } else {
      this.cropDatabase.push(crop);
    }
  }
}

// Export singleton instance
export const recommendationEngine = new CropRecommendationEngine();
