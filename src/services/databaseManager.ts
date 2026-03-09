import type { CropData } from '../types/crop';
import { cropDatabase } from './cropDatabase';

/**
 * Utility for managing the crop database
 * Supports importing from Excel data, CSV, JSON, etc.
 */
export class DatabaseManager {
  /**
   * Parse crop data from Excel row format
   * Expected format matches your Excel headers:
   * [cropNameEN, cropNameTA, phRange, soilTypeTA, soilTypeEN, tempRange, water, fertilizerReq, fertilizerAction, npk, micronutrients]
   */
  static parseExcelRow(
    row: string[],
    id: string
  ): CropData | null {
    if (row.length < 11) return null;

    try {
      const [
        cropNameEN,
        cropNameTA,
        phRangeStr,
        soilTypeTA,
        soilTypeEN,
        tempRangeStr,
        waterStr,
        fertilizerReq,
        fertilizerAction,
        npk,
        micronutrients,
      ] = row;

      // Parse pH range (e.g., "5.5-7.5")
      const phParts = phRangeStr?.split('-').map(p => parseFloat(p.trim())) ?? [];
      const phMin = phParts[0] ?? NaN;
      const phMax = phParts[1] ?? NaN;

      // Parse temperature range (e.g., "25-35")
      const tempParts = tempRangeStr?.split('-').map(t => parseFloat(t.trim())) ?? [];
      const tempMin = tempParts[0] ?? NaN;
      const tempMax = tempParts[1] ?? NaN;

      // Parse water requirement
      const water = parseFloat(waterStr ?? '');

      if (isNaN(phMin) || isNaN(phMax) || isNaN(tempMin) || isNaN(tempMax) || isNaN(water)) {
        console.warn(`Invalid numeric values in row for ${cropNameEN}`);
        return null;
      }

      return {
        id,
        cropNameEN: cropNameEN?.trim() ?? '',
        cropNameTA: cropNameTA?.trim() ?? '',
        phRange: { min: phMin, max: phMax },
        soilTypeTA: soilTypeTA?.trim() ?? '',
        soilTypeEN: soilTypeEN?.trim() ?? '',
        tempRange: { min: tempMin, max: tempMax },
        waterRequirement: water,
        fertilizerRequirementsEN: fertilizerReq?.trim() ?? '',
        fertilizerActionTA: fertilizerAction?.trim() ?? '',
        primaryFertilizer: npk?.trim() ?? '',
        micronutrients: micronutrients?.trim() ?? '',
      };
    } catch (error) {
      console.error('Error parsing Excel row:', error);
      return null;
    }
  }

  /**
   * Parse multiple crop rows from Excel data
   * Each row should be an array of strings matching Excel column format
   */
  static parseExcelData(rows: string[][]): CropData[] {
    return rows
      .map((row, index) => this.parseExcelRow(row, `crop_${index}`))
      .filter((crop): crop is CropData => crop !== null);
  }

  /**
   * Parse from JSON array format
   */
  static parseJsonData(data: unknown[]): CropData[] {
    return data
      .map((item, index) => {
        if (typeof item !== 'object' || item === null) return null;

        const obj = item as Record<string, unknown>;

        try {
          return {
            id: String(obj.id ?? `crop_${index}`),
            cropNameEN: String(obj.cropNameEN ?? obj.crop_name_en ?? ''),
            cropNameTA: String(obj.cropNameTA ?? obj.crop_name_ta ?? ''),
            phRange: {
              min: typeof obj.phMin === 'number' ? obj.phMin : 6,
              max: typeof obj.phMax === 'number' ? obj.phMax : 7,
            },
            soilTypeTA: String(obj.soilTypeTA ?? ''),
            soilTypeEN: String(obj.soilTypeEN ?? obj.soil_type ?? ''),
            tempRange: {
              min: typeof obj.tempMin === 'number' ? obj.tempMin : 20,
              max: typeof obj.tempMax === 'number' ? obj.tempMax : 30,
            },
            waterRequirement: typeof obj.waterRequirement === 'number' ? obj.waterRequirement : 500,
            fertilizerRequirementsEN: String(obj.fertilizerRequirementsEN ?? ''),
            fertilizerActionTA: String(obj.fertilizerActionTA ?? ''),
            primaryFertilizer: String(obj.primaryFertilizer ?? ''),
            micronutrients: String(obj.micronutrients ?? ''),
          };
        } catch (error) {
          console.warn(`Failed to parse item ${index}:`, error);
          return null;
        }
      })
      .filter((crop): crop is CropData => crop !== null);
  }

  /**
   * Parse CSV string data
   */
  static parseCSVData(csvString: string): CropData[] {
    const lines = csvString.split('\n').filter(line => line.trim());
    const rows = lines.map(line =>
      line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );

    // Skip header row
    if (rows.length > 1) {
      rows.shift();
    }

    return this.parseExcelData(rows);
  }

  /**
   * Export crops to JSON
   */
  static exportsAsJSON(crops: CropData[]): string {
    return JSON.stringify(crops, null, 2);
  }

  /**
   * Export crops to CSV
   */
  static exportAsCSV(crops: CropData[]): string {
    const headers = [
      'Crop Name (EN)',
      'பயிர் (TA)',
      'pH (Min-Max)',
      'Soil Type (TA)',
      'Soil Type (EN)',
      'Temp (°C)',
      'Water (mm)',
      'Fertilizer Requirements (EN)',
      'Fertilizer / Action (TA)',
      'Primary Fertilizer (NPK Ratio)',
      'Micronutrients & Special Needs',
    ];

    const rows = crops.map(crop => [
      crop.cropNameEN,
      crop.cropNameTA,
      `${crop.phRange.min}-${crop.phRange.max}`,
      crop.soilTypeTA,
      crop.soilTypeEN,
      `${crop.tempRange.min}-${crop.tempRange.max}`,
      crop.waterRequirement.toString(),
      crop.fertilizerRequirementsEN,
      crop.fertilizerActionTA,
      crop.primaryFertilizer,
      crop.micronutrients,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * Validate crop data
   */
  static validateCrop(crop: CropData): string[] {
    const errors: string[] = [];

    if (!crop.cropNameEN?.trim()) errors.push('Missing English crop name');
    if (!crop.cropNameTA?.trim()) errors.push('Missing Tamil crop name');
    if (crop.phRange.min >= crop.phRange.max) errors.push('Invalid pH range');
    if (crop.tempRange.min >= crop.tempRange.max) errors.push('Invalid temperature range');
    if (crop.waterRequirement <= 0) errors.push('Water requirement must be positive');

    return errors;
  }

  /**
   * Validate all crops
   */
  static validateAllCrops(crops: CropData[]): Map<string, string[]> {
    const validationResults = new Map<string, string[]>();

    for (const crop of crops) {
      const errors = this.validateCrop(crop);
      if (errors.length > 0) {
        validationResults.set(crop.id, errors);
      }
    }

    return validationResults;
  }

  /**
   * Merge crops into the database
   * Replaces existing crops with same ID, adds new ones
   */
  static mergeCrops(newCrops: CropData[], database: CropData[] = cropDatabase): CropData[] {
    const merged = [...database];

    for (const newCrop of newCrops) {
      const existingIndex = merged.findIndex(c => c.id === newCrop.id);
      if (existingIndex >= 0) {
        merged[existingIndex] = newCrop;
      } else {
        merged.push(newCrop);
      }
    }

    return merged;
  }

  /**
   * Search crops by name or match criteria
   */
  static searchCrops(
    query: string,
    database: CropData[] = cropDatabase
  ): CropData[] {
    const lowerQuery = query.toLowerCase();

    return database.filter(
      crop =>
        crop.cropNameEN.toLowerCase().includes(lowerQuery) ||
        crop.cropNameTA.includes(query) ||
        crop.soilTypeEN.toLowerCase().includes(lowerQuery) ||
        crop.micronutrients.toLowerCase().includes(lowerQuery)
    );
  }
}

/**
 * Example usage:
 *
 * // Parsing Excel data
 * const excelRows = [
 *   ['Rice', 'அரிசி', '5.5-7.5', 'களிமண்', 'Clayey Soil', '25-35', '1000', '...', '...', '20-20-20', 'Zinc, Iron'],
 * ]
 * const crops = DatabaseManager.parseExcelData(excelRows)
 *
 * // Parsing CSV
 * const csvData = await fetch('data.csv').then(r => r.text())
 * const crops = DatabaseManager.parseCSVData(csvData)
 *
 * // Validating
 * const errors = DatabaseManager.validateAllCrops(crops)
 *
 * // Exporting
 * const csv = DatabaseManager.exportAsCSV(cropDatabase)
 * console.log(csv)
 */
