#include <WiFi.h>
#include <PubSubClient.h>

// Wi-Fi credentials - Connect to existing WiFi network
const char* ssid = "pooja";
const char* password = "12345678";

// HiveMQ Cloud MQTT Broker settings
const char* mqtt_server = "bec6e48a9b5e4d27860b9d4d491e6d88.s1.eu.hivemq.cloud";
const int mqtt_port = 8883; // TLS port for secure connection
const char* mqtt_username = "hivemq.webclient.1773056535268";
const char* mqtt_password = "FtTa<R3gr29S,VwO:@0n"
const char* mqtt_client_id = "SoilSenseThozhan_01"; // Unique client ID
const char* mqtt_topic = "soilsense/sensor/data";
const char* mqtt_ph_topic = "soilsense/sensor/ph";

// Sensor pins (adjust based on your hardware)
#define TEMP_SENSOR_PIN 34
#define MOISTURE_SENSOR_PIN 35
#define PH_SENSOR_PIN 32

WiFiClient espClient;
PubSubClient client(espClient);

// Sensor data variables
float temperature = 0.0;
int moisture = 0;
float soil_ph = 7.0;

// Timing variables
unsigned long lastPublish = 0;
const long publishInterval = 5000; // Publish every 5 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize sensor pins
  pinMode(TEMP_SENSOR_PIN, INPUT);
  pinMode(MOISTURE_SENSOR_PIN, INPUT);
  pinMode(PH_SENSOR_PIN, INPUT);

  // Connect to Wi-Fi
  setupWiFi();

  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);

  Serial.println("Setup complete!");
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  // Connect to existing WiFi network
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Attempt to connect with username and password
    if (client.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("connected");
      // Subscribe to pH input topic (for manual pH entry from web)
      client.subscribe(mqtt_ph_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Handle pH value updates from web interface
  if (String(topic) == mqtt_ph_topic) {
    soil_ph = message.toFloat();
    Serial.print("pH updated to: ");
    Serial.println(soil_ph);
  }
}

void readSensors() {
  // Read temperature (example - adjust based on your sensor)
  int tempRaw = analogRead(TEMP_SENSOR_PIN);
  temperature = map(tempRaw, 0, 4095, 0, 50); // Map to 0-50°C range
  
  // Read moisture (analog value)
  moisture = analogRead(MOISTURE_SENSOR_PIN);
  
  // Read pH (example calculation - adjust based on your sensor calibration)
  int phRaw = analogRead(PH_SENSOR_PIN);
  soil_ph = map(phRaw, 0, 4095, 0, 1400) / 100.0; // Map to pH 0-14
}

void publishSensorData() {
  // Create JSON payload
  String payload = "{";
  payload += "\"temperature\":" + String(temperature, 2) + ",";
  payload += "\"moisture\":" + String(moisture) + ",";
  payload += "\"soil_ph\":" + String(soil_ph, 2) + ",";
  payload += "\"soil_type\":\"loamy\",";
  payload += "\"timestamp\":\"" + String(millis()) + "\"";
  payload += "}";

  // Publish to MQTT topic
  if (client.publish(mqtt_topic, payload.c_str())) {
    Serial.println("Published: " + payload);
  } else {
    Serial.println("Publish failed");
  }
}

void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  // Read and publish sensor data at regular intervals
  unsigned long currentMillis = millis();
  if (currentMillis - lastPublish >= publishInterval) {
    lastPublish = currentMillis;
    
    readSensors();
    publishSensorData();
  }
}
