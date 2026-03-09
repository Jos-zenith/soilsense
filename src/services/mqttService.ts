/**
 * Production-ready MQTT Sensor Service using mqtt.js
 * Use this implementation for real deployments
 * 
 * To use: Replace the MQTT methods in sensorService.ts with this implementation
 */

import mqtt, { MqttClient } from 'mqtt';
import type { SensorData } from '../types/crop';
import type { MQTTConfig } from '../config/mqttConfig';
import { defaultMQTTConfig } from '../config/mqttConfig';

export class MQTTSensorService {
  private mqttClient: MqttClient | null = null;
  private mqttConfig: MQTTConfig;
  private dataCallback: ((data: SensorData) => void) | null = null;

  constructor(mqttConfig: MQTTConfig = defaultMQTTConfig) {
    this.mqttConfig = mqttConfig;
  }

  /**
   * Connect to MQTT broker using mqtt.js
   */
  connectMQTT(
    onDataReceived: (data: SensorData) => void,
    onError: (error: Error) => void,
    onConnected?: () => void
  ): void {
    const { brokerUrl, port, protocol, clientId, topics, options, username, password } = 
      this.mqttConfig;

    const url = `${protocol}://${brokerUrl}:${port}/mqtt`;
    
    this.dataCallback = onDataReceived;

    const connectOptions: mqtt.IClientOptions = {
      clientId,
      clean: true,
      reconnectPeriod: options.reconnectPeriod,
      connectTimeout: options.connectTimeout,
      keepalive: options.keepalive,
      username,
      password,
    };

    try {
      this.mqttClient = mqtt.connect(url, connectOptions);

      // Handle connection success
      this.mqttClient.on('connect', () => {
        console.log('✅ MQTT Connected to', brokerUrl);
        
        // Subscribe to sensor data topic
        this.mqttClient?.subscribe(topics.sensorData, { qos: 1 }, (err) => {
          if (err) {
            console.error('❌ Subscription error:', err);
            onError(new Error(`Failed to subscribe: ${err.message}`));
          } else {
            console.log('📡 Subscribed to', topics.sensorData);
            if (onConnected) onConnected();
          }
        });
      });

      // Handle messages
      this.mqttClient.on('message', (topic, message) => {
        try {
          if (topic === topics.sensorData) {
            const payload = message.toString();
            const rawData = JSON.parse(payload);
            const sensorData = this.parseSensorData(rawData);
            
            if (this.dataCallback) {
              this.dataCallback(sensorData);
            }
          }
        } catch (error) {
          onError(
            new Error(
              `Error parsing message: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      });

      // Handle errors
      this.mqttClient.on('error', (error) => {
        console.error('❌ MQTT Error:', error);
        onError(error);
      });

      // Handle disconnection
      this.mqttClient.on('close', () => {
        console.log('🔌 MQTT Disconnected');
      });

      // Handle reconnection
      this.mqttClient.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...');
      });

      // Handle offline status
      this.mqttClient.on('offline', () => {
        console.log('📴 MQTT Offline');
      });

    } catch (error) {
      onError(
        new Error(
          `Failed to connect MQTT: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Publish data to MQTT topic
   */
  publishToMQTT(topic: string, payload: string | object, qos: 0 | 1 | 2 = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mqttClient || !this.mqttClient.connected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const message = typeof payload === 'string' ? payload : JSON.stringify(payload);

      this.mqttClient.publish(topic, message, { qos }, (error) => {
        if (error) {
          console.error('❌ Publish error:', error);
          reject(error);
        } else {
          console.log('📤 Published to', topic, ':', message);
          resolve();
        }
      });
    });
  }

  /**
   * Send pH value to ESP32 sensor
   */
  async sendPhValueToSensor(phValue: number): Promise<void> {
    if (phValue < 0 || phValue > 14) {
      throw new Error('pH value must be between 0 and 14');
    }

    const topic = this.mqttConfig.topics.sensorPh;
    await this.publishToMQTT(topic, phValue.toString());
  }

  /**
   * Send control command to sensor
   */
  async sendControlCommand(command: string, value?: any): Promise<void> {
    const topic = this.mqttConfig.topics.sensorControl;
    const payload = value !== undefined ? { command, value } : { command };
    await this.publishToMQTT(topic, payload);
  }

  /**
   * Subscribe to additional topic
   */
  async subscribeTopic(
    topic: string,
    callback: (message: string) => void,
    qos: 0 | 1 | 2 = 1
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mqttClient || !this.mqttClient.connected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      this.mqttClient.subscribe(topic, { qos }, (err) => {
        if (err) {
          reject(err);
        } else {
          // Add message handler
          this.mqttClient?.on('message', (receivedTopic, message) => {
            if (receivedTopic === topic) {
              callback(message.toString());
            }
          });
          resolve();
        }
      });
    });
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeTopic(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mqttClient) {
        reject(new Error('MQTT client not initialized'));
        return;
      }

      this.mqttClient.unsubscribe(topic, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnectMQTT(): Promise<void> {
    return new Promise((resolve) => {
      if (this.mqttClient) {
        this.mqttClient.end(true, {}, () => {
          console.log('🔌 MQTT Disconnected successfully');
          this.mqttClient = null;
          this.dataCallback = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if MQTT is connected
   */
  isConnected(): boolean {
    return this.mqttClient?.connected ?? false;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    if (!this.mqttClient) return 'not_initialized';
    if (this.mqttClient.connected) return 'connected';
    if (this.mqttClient.reconnecting) return 'reconnecting';
    return 'disconnected';
  }

  /**
   * Parse raw sensor data into SensorData type
   */
  private parseSensorData(rawData: any): SensorData {
    return {
      soil_ph: this.parseNumber(rawData.soil_ph ?? rawData.ph ?? rawData.pH, 6.5),
      soil_type: String(rawData.soil_type ?? rawData.soilType ?? 'unknown'),
      temperature: this.parseNumber(rawData.temperature ?? rawData.temp, 25),
      moisture: this.parseNumber(rawData.moisture ?? rawData.soilMoisture, 500),
      nitrogen: this.parseNumber(rawData.nitrogen ?? rawData.N, undefined),
      phosphorus: this.parseNumber(rawData.phosphorus ?? rawData.P, undefined),
      potassium: this.parseNumber(rawData.potassium ?? rawData.K, undefined),
      timestamp: rawData.timestamp ? new Date(rawData.timestamp) : new Date(),
    };
  }

  /**
   * Parse number with fallback
   */
  private parseNumber(value: any, fallback: number | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? (fallback ?? 0) : parsed;
    }
    return fallback ?? 0;
  }
}

// Export singleton instance
export const mqttSensorService = new MQTTSensorService();
