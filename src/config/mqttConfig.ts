/**
 * MQTT Configuration for SoilSense Thozhan
 * 
 * For browser-based MQTT connection, use WebSocket-enabled brokers:
 * - HiveMQ: wss://broker.hivemq.com:8884/mqtt
 * - Mosquitto: wss://test.mosquitto.org:8081
 * - EMQX: wss://broker.emqx.io:8084/mqtt
 */

export interface MQTTConfig {
  brokerUrl: string;
  port: number;
  protocol: 'ws' | 'wss';
  clientId: string;
  username?: string;
  password?: string;
  topics: {
    sensorData: string;
    sensorPh: string;
    sensorControl: string;
  };
  options: {
    reconnectPeriod: number;
    connectTimeout: number;
    keepalive: number;
  };
}

// HiveMQ Cloud Cluster Configuration
// TODO: Add your HiveMQ credentials from the Manage Cluster page
export const defaultMQTTConfig: MQTTConfig = {
  brokerUrl: 'bec6e48a9b5e4d27860b9d4d491e6d88.s1.eu.hivemq.cloud',
  port: 8884, // WebSocket Secure port
  protocol: 'wss',
  clientId: `soilsense_web_${Math.random().toString(16).substr(2, 8)}`,
  username: 'hivemq.webclient.1773056535268',
  password: 'FtTa<R3gr29S,VwO:@0n'
  topics: {
    sensorData: 'soilsense/sensor/data',
    sensorPh: 'soilsense/sensor/ph',
    sensorControl: 'soilsense/sensor/control',
  },
  options: {
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
  },
};

// Alternative: Local MQTT broker configuration
export const localMQTTConfig: MQTTConfig = {
  brokerUrl: 'localhost',
  port: 9001, // Default WebSocket port for Mosquitto
  protocol: 'ws',
  clientId: `soilsense_web_${Math.random().toString(16).substr(2, 8)}`,
  topics: {
    sensorData: 'soilsense/sensor/data',
    sensorPh: 'soilsense/sensor/ph',
    sensorControl: 'soilsense/sensor/control',
  },
  options: {
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
  },
};
