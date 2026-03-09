/**
 * Example / Testing file demonstrating how to use the crop recommendation system
 * This file shows various usage patterns and can be used for testing
 */

import { CropRecommendationEngine } from '../services/recommendationEngine';
import { DatabaseManager } from '../services/databaseManager';
import { SensorService } from '../services/sensorService';
import type { SensorData, CropData } from '../types/crop';

/**
 * Example 1: Basic recommendation based on sensor data
 */
export function example_basicRecommendation() {
  const engine = new CropRecommendationEngine();

  const sensorData: SensorData = {
    soil_ph: 6.5,
    soil_type: 'clayey soil',
    temperature: 28,
    moisture: 600,
  };

  const recommendations = engine.getRecommendations(sensorData);

  console.log('Top 3 Recommendations:');
  recommendations.slice(0, 3).forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.crop.cropNameEN} - Match Score: ${rec.matchScore}%`);
    console.log(`   Reasons: ${rec.reasons.join('; ')}`);
    console.log(`   Actions:\n   - ${rec.actionRequired.join('\n   - ')}`);
  });
}

/**
 * Example 2: Import crops from Excel data
 */
export function example_importFromExcel() {
  // Simulating Excel data (rows of strings)
  const excelRows = [
    [
      'Wheat',
      'கோதுமை',
      '6.0-7.0',
      'மணற்களிமண்',
      'Sandy Loam Soil',
      '15-25',
      '400',
      'Moderate nitrogen requirement',
      'நடுத்தர நைட்ரஜன்',
      '15-15-15',
      'Zinc, Iron',
    ],
    [
      'Onion',
      'வெங்காயம்',
      '6.0-7.5',
      'மணற்களிமண்',
      'Sandy Loam Soil',
      '10-25',
      '300',
      'Low nitrogen, high potassium',
      'குறைந்த நைட்ரஜன், அதிக பொட்டாசியம்',
      '10-20-30',
      'Boron, Sulfur',
    ],
  ];

  const importedCrops = DatabaseManager.parseExcelData(excelRows);

  console.log('Imported crops:');
  importedCrops.forEach(crop => {
    console.log(`- ${crop.cropNameEN} (${crop.cropNameTA})`);
    console.log(`  pH: ${crop.phRange.min}-${crop.phRange.max}, Temp: ${crop.tempRange.min}-${crop.tempRange.max}°C`);
  });

  // Validate
  const validationErrors = DatabaseManager.validateAllCrops(importedCrops);
  if (validationErrors.size === 0) {
    console.log('✓ All crops validated successfully');
  } else {
    console.log('Validation errors:');
    validationErrors.forEach((errors, cropId) => {
      console.log(`  ${cropId}: ${errors.join(', ')}`);
    });
  }
}

/**
 * Example 3: Search for crops by criteria
 */
export function example_searchCrops() {
  // Search for crops that grow in sandy loam soil
  const sandy_crops = DatabaseManager.searchCrops('sandy loam');
  console.log('Crops suitable for Sandy Loam soil:');
  sandy_crops.forEach(crop => {
    console.log(`- ${crop.cropNameEN} (${crop.cropNameTA})`);
  });

  // Search for crops with high nitrogen requirement
  const nitrogen_crops = DatabaseManager.searchCrops('nitrogen');
  console.log('\nCrops with nitrogen requirements:');
  nitrogen_crops.forEach(crop => {
    console.log(`- ${crop.cropNameEN}: ${crop.fertilizerRequirementsEN}`);
  });
}

/**
 * Example 4: Export crop database
 */
export function example_exportData() {
  const engine = new CropRecommendationEngine();
  const allCrops = engine.getAllCrops();

  // Export as CSV
  const csvData = DatabaseManager.exportAsCSV(allCrops);
  console.log('CSV Export:');
  console.log(csvData);

  // Export as JSON
  const jsonData = DatabaseManager.exportsAsJSON(allCrops);
  console.log('\nJSON Export:');
  console.log(jsonData);
}

/**
 * Example 5: Add custom crop to database
 */
export function example_addCustomCrop() {
  const engine = new CropRecommendationEngine();

  const customCrop: CropData = {
    id: 'mango_001',
    cropNameEN: 'Mango',
    cropNameTA: 'மாம்பழம்',
    phRange: { min: 5.5, max: 7.5 },
    soilTypeTA: 'களிமண், மணற்களிமண்',
    soilTypeEN: 'Clayey Loam Soil',
    tempRange: { min: 24, max: 30 },
    waterRequirement: 800,
    fertilizerRequirementsEN: 'Moderate nitrogen, high phosphorus for flowering',
    fertilizerActionTA: 'நடுத்தர நைட்ரஜன், அதிக பாஸ்பரஸ்',
    primaryFertilizer: '10-30-20',
    micronutrients: 'Zinc, Iron, Manganese, Boron',
  };

  engine.addCrop(customCrop);
  console.log('✓ Mango crop added to database');

  // Test recommendation with the new crop
  const sensorData: SensorData = {
    soil_ph: 6.5,
    soil_type: 'clayey loam',
    temperature: 27,
    moisture: 700,
  };

  const recommendations = engine.getRecommendations(sensorData);
  const mangoRec = recommendations.find(r => r.crop.id === 'mango_001');
  if (mangoRec) {
    console.log(`Mango match score: ${mangoRec.matchScore}%`);
  }
}

/**
 * Example 6: Sensor service usage (mock)
 */
export async function example_sensorService() {
  // Create mock sensor data
  const mockData = SensorService.createMockSensorData({
    temperature: 26,
    soil_ph: 6.2,
  });

  console.log('Mock sensor data:', mockData);

  // In real usage, you would:
  // const realData = await service.fetchSensorData('sensor-1')
  // service.connectWebSocket('sensor-1', (data) => { ... }, (error) => { ... })
}

/**
 * Example 7: Complete workflow
 */
export async function example_completeWorkflow() {
  console.log('=== Complete Crop Recommendation Workflow ===\n');

  // 1. Initialize engine
  const engine = new CropRecommendationEngine();
  console.log(`✓ Initialized with ${engine.getAllCrops().length} crops\n`);

  // 2. Get sensor data (simulated)
  const sensorData: SensorData = {
    soil_ph: 6.8,
    soil_type: 'sandy loam',
    temperature: 26,
    moisture: 450,
    timestamp: new Date(),
  };
  console.log('Sensor Data:');
  console.log(`  pH: ${sensorData.soil_ph}`);
  console.log(`  Soil: ${sensorData.soil_type}`);
  console.log(`  Temp: ${sensorData.temperature}°C`);
  console.log(`  Moisture: ${sensorData.moisture}mm\n`);

  // 3. Get recommendations
  const recommendations = engine.getRecommendations(sensorData);
  console.log(`✓ Generated ${recommendations.length} recommendations\n`);

  // 4. Display top recommendation
  const topRec = recommendations[0];
  if (topRec) {
    console.log('🏆 Top Recommendation:');
    console.log(`  Crop: ${topRec.crop.cropNameEN} (${topRec.crop.cropNameTA})`);
    console.log(`  Match Score: ${topRec.matchScore}%`);
    console.log(`  Analysis:`);
    topRec.reasons.forEach(reason => console.log(`    - ${reason}`));
    console.log(`  Actions:`);
    topRec.actionRequired.forEach(action => console.log(`    → ${action}`));
  }

  // 5. Get fertilizer details
  const fertilizerRec = engine.getFertilizerRecommendation(topRec?.crop.id || '');
  if (fertilizerRec) {
    console.log(`\n🌱 Fertilizer Recommendation:`);
    console.log(`  NPK Ratio: ${fertilizerRec.npkRatio}`);
    console.log(`  Micronutrients: ${fertilizerRec.micronutrients}`);
    console.log(`  Action (TA): ${fertilizerRec.actionTA}`);
  }
}

/**
 * Example 8: Parse CSV data from file
 */
export function example_parseCSV() {
  // Simulating CSV data
  const csvContent = `Crop Name (EN),பயிர் (TA),pH (Min-Max),Soil Type (TA),Soil Type(EN),Temp (°C),Water (mm),Fertilizer Requirements (EN),Fertilizer / Action (TA),Primary Fertilizer (NPK Ratio),Micronutrients & Special Needs
Barley,வெளி,6.0-7.5,மணற்களிமண்,Sandy Loam Soil,10-20,300,Low nitrogen requirement,குறைந்த நைட்ரஜன்,10-10-10,Zinc
Chickpea,உளுந்து,6.5-7.5,மணல்,Sandy Soil,15-25,400,Nitrogen from legume crop,பயிர் நைட்ரஜன்,0-15-20,Boron`;

  const crops = DatabaseManager.parseCSVData(csvContent);
  console.log('Parsed CSV crops:');
  crops.forEach(crop => {
    console.log(`- ${crop.cropNameEN} (${crop.cropNameTA}): pH ${crop.phRange.min}-${crop.phRange.max}`);
  });
}

// Run examples (uncomment to test)
// example_basicRecommendation()
// example_importFromExcel()
// example_searchCrops()
// example_exportData()
// example_addCustomCrop()
// example_parseCSV()
// example_completeWorkflow()
