#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Wi-Fi credentials
const char* ssid = "ZE A35";
const char* password = "dontknow";

// HiveMQ Cloud MQTT Broker
const char* mqtt_server = "bec6e48a9b5e4d27860b9d4d491e6d88.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "hivemq.webclient.1773056535268";
const char* mqtt_password = "FtTa<R3gr29S,VwO:@0n";
const char* mqtt_client_id = "SoilSenseThozhan_01";
const char* mqtt_topic = "soilsense/sensor/data";
const char* mqtt_ph_topic = "soilsense/sensor/ph";

// Sensor pins
#define MOISTURE_PIN 34
#define TEMP_PIN 4

#define MAX485_RX 16   // RO
#define MAX485_TX 17   // DI
#define MAX485_CONTROL 18 // RE + DE

// DS18B20 temperature sensor
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

// MQTT
WiFiClientSecure espClient;
PubSubClient client(espClient);

// Sensor variables
float temperature = 0.0;
int moisture = 0;
float soil_ph = 7.0;  // manual input via MQTT
int nitrogen = 0;
int phosphorus = 0;
int potassium = 0;

// Timing
unsigned long lastPublish = 0;
const long publishInterval = 5000;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Moisture pin
  pinMode(MOISTURE_PIN, INPUT);

  // MAX485 control pin
  pinMode(MAX485_CONTROL, OUTPUT);
  digitalWrite(MAX485_CONTROL, LOW); // start in receive mode

  // Start temperature sensor
  sensors.begin();

  // Connect Wi-Fi
  setupWiFi();

  // MQTT secure setup
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);

  Serial.println("Setup complete!");
}

void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

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
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("connected");
      client.subscribe(mqtt_ph_topic);
      Serial.println("Subscribed to pH topic");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(message);

  if (String(topic) == mqtt_ph_topic) {
    soil_ph = message.toFloat();
    Serial.print("pH updated to: ");
    Serial.println(soil_ph);
  }
}

void readSensors() {
  // Moisture sensor
  moisture = analogRead(MOISTURE_PIN);

  // Temperature sensor
  sensors.requestTemperatures();
  temperature = sensors.getTempCByIndex(0);

  // NPK sensor (simulated for now; replace with MAX485 reading later)
  // Set MAX485 to receive mode
  digitalWrite(MAX485_CONTROL, LOW);
  
  // Here you would read RS485 sensor values via Serial2 or Modbus
  // For prototype, we simulate:
  nitrogen = random(20, 50);
  phosphorus = random(10, 30);
  potassium = random(15, 40);
}

void publishSensorData() {
  String payload = "{";
  payload += "\"temperature\":" + String(temperature, 2) + ",";
  payload += "\"moisture\":" + String(moisture) + ",";
  payload += "\"soil_ph\":" + String(soil_ph, 2) + ",";
  payload += "\"nitrogen\":" + String(nitrogen) + ",";
  payload += "\"phosphorus\":" + String(phosphorus) + ",";
  payload += "\"potassium\":" + String(potassium) + ",";
  payload += "\"soil_type\":\"Clay Loam\",";
  payload += "\"timestamp\":\"" + String(millis()) + "\"";
  payload += "}";

  if (client.publish(mqtt_topic, payload.c_str())) {
    Serial.println("✅ Published: " + payload);
  } else {
    Serial.println("❌ Publish failed");
  }
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  unsigned long currentMillis = millis();
  if (currentMillis - lastPublish >= publishInterval) {
    lastPublish = currentMillis;
    readSensors();
    publishSensorData();
  }
}
