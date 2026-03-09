import { ref, computed } from 'vue';
import type { SensorData, CropRecommendation } from '../types/crop';
import { recommendationEngine } from '../services/recommendationEngine';

/**
 * Vue composable for crop recommendations
 * Usage in Vue components:
 * const { recommendations, loading, error, getSuggestions } = useCropRecommendations()
 */
export function useCropRecommendations() {
  const recommendations = ref<CropRecommendation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Get crop suggestions based on sensor data
   */
  const getSuggestions = async (sensorData: SensorData) => {
    loading.value = true;
    error.value = null;

    try {
      // Simulate async operation (for future API calls)
      recommendations.value = recommendationEngine.getRecommendations(sensorData);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get recommendations';
      console.error('Error getting recommendations:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get the top recommendation
   */
  const topRecommendation = computed(() => recommendations.value[0] || null);

  /**
   * Get all crops in the database
   */
  const getAllCrops = () => {
    return recommendationEngine.getAllCrops();
  };

  /**
   * Get fertilizer recommendation for a crop
   */
  const getFertilizerRecommendation = (cropId: string) => {
    return recommendationEngine.getFertilizerRecommendation(cropId);
  };

  return {
    recommendations,
    topRecommendation,
    loading,
    error,
    getSuggestions,
    getAllCrops,
    getFertilizerRecommendation,
  };
}
