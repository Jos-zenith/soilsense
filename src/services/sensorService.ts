import type { SensorData } from '../types/crop';
import type { MQTTConfig } from '../config/mqttConfig';
import { defaultMQTTConfig } from '../config/mqttConfig';

/**
 * API service for fetching real sensor data
 * Can be connected to:
 * - IoT sensors via MQTT/WebSocket
 * - Backend API endpoints
 * - Hardware devices via serial communication
 */
export class SensorService {
  private apiBaseUrl: string;
  private webSocketConnection: WebSocket | null = null;
  private mqttClient: WebSocket | null = null;
  private mqttConfig: MQTTConfig;
  private mqttConnected: boolean = false;

  constructor(
    apiBaseUrl: string = 'http://localhost:3000/api',
    mqttConfig: MQTTConfig = defaultMQTTConfig
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.mqttConfig = mqttConfig;
  }

  /**
   * Fetch sensor data from API endpoint
   */
  async fetchSensorData(sensorId?: string): Promise<SensorData> {
    try {
      const url = sensorId
        ? `${this.apiBaseUrl}/sensors/${sensorId}`
        : `${this.apiBaseUrl}/sensors/latest`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.parseSensorData(data);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      throw error;
    }
  }

  /**
   * Fetch historical sensor data
   */
  async fetchSensorHistory(
    sensorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SensorData[]> {
    try {
      const url = `${this.apiBaseUrl}/sensors/${sensorId}/history`;
      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: unknown) => this.parseSensorData(item));
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      throw error;
    }
  }

  /**
   * Submit manual sensor reading
   */
  async submitSensorReading(sensorData: SensorData): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sensors/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sensorData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting sensor reading:', error);
      throw error;
    }
  }

  /**
   * Connect to WebSocket for real-time sensor updates
   */
  connectWebSocket(
    sensorId: string,
    onDataReceived: (data: SensorData) => void,
    onError: (error: Error) => void
  ): void {
    const wsUrl = this.apiBaseUrl.replace(/^http/, 'ws');
    const url = `${wsUrl}/sensors/${sensorId}/live`;

    try {
      this.webSocketConnection = new WebSocket(url);

      this.webSocketConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const sensorData = this.parseSensorData(data);
          onDataReceived(sensorData);
        } catch (error) {
          onError(
            new Error(
              `Error parsing sensor data: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      };

      this.webSocketConnection.onerror = () => {
        onError(new Error('WebSocket connection error'));
      };

      this.webSocketConnection.onclose = () => {
        console.log('WebSocket connection closed');
      };
    } catch (error) {
      onError(
        new Error(
          `Failed to connect WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnectWebSocket(): void {
    if (this.webSocketConnection) {
      this.webSocketConnection.close();
      this.webSocketConnection = null;
    }
  }

  /**
   * Connect to MQTT broker via WebSocket
   * For browser-based MQTT communication with ESP32 sensors
   */
  connectMQTT(
    onDataReceived: (data: SensorData) => void,
    onError: (error: Error) => void,
    onConnected?: () => void
  ): void {
    const { brokerUrl, port, protocol, topics } = this.mqttConfig;
    const wsUrl = `${protocol}://${brokerUrl}:${port}/mqtt`;

    try {
      // For MQTT over WebSocket, you'll need a library like mqtt.js
      // This is a simplified WebSocket example
      this.mqttClient = new WebSocket(wsUrl);

      this.mqttClient.onopen = () => {
        console.log('MQTT WebSocket connected');
        this.mqttConnected = true;
        
        // Send MQTT CONNECT packet (simplified - use mqtt.js for production)
        this.subscribeMQTTTopic(topics.sensorData);
        
        if (onConnected) onConnected();
      };

      this.mqttClient.onmessage = (event) => {
        try {
          // Parse MQTT message (simplified - actual MQTT parsing is more complex)
          const message = this.parseMQTTMessage(event.data);
          if (message.topic === topics.sensorData) {
            const sensorData = this.parseSensorData(JSON.parse(message.payload));
            onDataReceived(sensorData);
          }
        } catch (error) {
          onError(
            new Error(
              `Error parsing MQTT data: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      };

      this.mqttClient.onerror = () => {
        onError(new Error('MQTT WebSocket connection error'));
      };

      this.mqttClient.onclose = () => {
        console.log('MQTT WebSocket connection closed');
        this.mqttConnected = false;
      };
    } catch (error) {
      onError(
        new Error(
          `Failed to connect MQTT: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Subscribe to MQTT topic
   */
  private subscribeMQTTTopic(topic: string): void {
    if (this.mqttClient && this.mqttConnected) {
      // Send MQTT SUBSCRIBE packet (simplified)
      // In production, use mqtt.js library which handles this properly
      console.log(`Subscribing to MQTT topic: ${topic}`);
    }
  }

  /**
   * Publish data to MQTT topic (e.g., send pH value to ESP32)
   */
  publishToMQTT(topic: string, payload: string | object): void {
    if (!this.mqttClient || !this.mqttConnected) {
      console.error('MQTT not connected');
      return;
    }

    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // Send MQTT PUBLISH packet (simplified)
    // In production, use mqtt.js library
    console.log(`Publishing to ${topic}: ${message}`);
  }

  /**
   * Send pH value to ESP32 via MQTT
   */
  sendPhValueToSensor(phValue: number): void {
    const topic = this.mqttConfig.topics.sensorPh;
    this.publishToMQTT(topic, phValue.toString());
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnectMQTT(): void {
    if (this.mqttClient) {
      this.mqttClient.close();
      this.mqttClient = null;
      this.mqttConnected = false;
    }
  }

  /**
   * Parse MQTT message (simplified - use mqtt.js for production)
   */
  private parseMQTTMessage(data: string | ArrayBuffer): { topic: string; payload: string } {
    // This is a simplified parser
    // In production, use mqtt.js library which handles MQTT protocol properly
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return {
          topic: parsed.topic || this.mqttConfig.topics.sensorData,
          payload: parsed.payload || data,
        };
      } catch {
        return {
          topic: this.mqttConfig.topics.sensorData,
          payload: data,
        };
      }
    }
    return {
      topic: this.mqttConfig.topics.sensorData,
      payload: new TextDecoder().decode(data),
    };
  }

  /**
   * Check if MQTT is connected
   */
  isMQTTConnected(): boolean {
    return this.mqttConnected;
  }

  /**
   * Parse raw sensor data into SensorData type
   * Handles different data formats from various sensors
   */
  private parseSensorData(rawData: unknown): SensorData {
    if (typeof rawData !== 'object' || rawData === null) {
      throw new Error('Invalid sensor data format');
    }

    const data = rawData as Record<string, unknown>;

    return {
      soil_ph: this.parseNumber(data.soil_ph ?? data.ph ?? data.pH, 6.5),
      soil_type: String(data.soil_type ?? data.soilType ?? 'unknown'),
      temperature: this.parseNumber(data.temperature ?? data.temp ?? data.temperature, 25),
      moisture: this.parseNumber(data.moisture ?? data.soilMoisture ?? data.water, 500),
      nitrogen: this.parseNumber(data.nitrogen ?? data.N, undefined),
      phosphorus: this.parseNumber(data.phosphorus ?? data.P, undefined),
      potassium: this.parseNumber(data.potassium ?? data.K, undefined),
      timestamp: data.timestamp ? new Date(data.timestamp as string) : new Date(),
    };
  }

  /**
   * Parse number from unknown type with fallback
   */
  private parseNumber(value: unknown, fallback: number | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback ?? 0 : parsed;
    }
    return fallback ?? 0;
  }

  /**
   * Get available sensors list
   */
  async getAvailableSensors(): Promise<Array<{ id: string; name: string; location: string }>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sensors`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sensors list:', error);
      return [];
    }
  }

  /**
   * Initialize sample sensor data (for demo/testing)
   * Remove in production
   */
  static createMockSensorData(overrides?: Partial<SensorData>): SensorData {
    return {
      soil_ph: 6.5,
      soil_type: 'clayey soil',
      temperature: 28,
      moisture: 500,
      ...overrides,
    };
  }
}

// Export singleton instance
export const sensorService = new SensorService();
