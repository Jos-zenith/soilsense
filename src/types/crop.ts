// Crop and fertilizer data types
export interface CropData {
  id: string;
  cropNameEN: string;
  cropNameTA: string;
  phRange: {
    min: number;
    max: number;
  };
  soilTypeTA: string;
  soilTypeEN: string;
  tempRange: {
    min: number;
    max: number;
  };
  waterRequirement: number; // in mm
  fertilizerRequirementsEN: string;
  fertilizerActionTA: string;
  primaryFertilizer: string; // NPK Ratio (e.g., "10-20-20")
  micronutrients: string;
}

// Sensor input data
export interface SensorData {
  soil_ph: number;
  soil_type: string;
  temperature: number;
  moisture: number; // in mm or percentage
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  timestamp?: Date;
}

// Crop recommendation result
export interface CropRecommendation {
  crop: CropData;
  matchScore: number; // 0-100
  reasons: string[];
  actionRequired: string[];
}

// Fertilizer recommendation
export interface FertilizerRecommendation {
  cropName: string;
  npkRatio: string;
  micronutrients: string;
  actionTA: string;
  actionEN: string;
}
