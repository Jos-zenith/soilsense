# VICT Deployment Guide

## Prerequisites

Before deploying, you need to:

1. **Get HiveMQ Cloud Credentials**
   - Go to [HiveMQ Cloud Console](https://console.hivemq.cloud/)
   - Click "Manage Cluster" on your Free #1 cluster
   - Navigate to "Access Management"
   - Create a new user or copy existing credentials
   - Note down the **username** and **password**

2. **Update Configuration Files**

### Web Application (src/config/mqttConfig.ts)
Replace these values:
```typescript
username: 'YOUR_HIVEMQ_USERNAME',
password: 'YOUR_HIVEMQ_PASSWORD',
```

### ESP32 Arduino (arduino/esp32_mqtt_sensor/esp32_mqtt_sensor.ino)
Replace these values:
```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_username = "YOUR_HIVEMQ_USERNAME";
const char* mqtt_password = "YOUR_HIVEMQ_PASSWORD";
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Add environment variables in Vercel dashboard:
   - `VITE_MQTT_USERNAME`
   - `VITE_MQTT_PASSWORD`

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

4. Add environment variables in Netlify dashboard

### Option 3: GitHub Pages

1. Install gh-pages:
   ```bash
   npm install -D gh-pages
   ```

2. Add to package.json:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. Update vite.config.ts with base URL:
   ```typescript
   export default defineConfig({
     base: '/soilsense/',
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

---

## ESP32 Setup

### Required Libraries
Install these via Arduino IDE Library Manager:
- **WiFi** (built-in)
- **PubSubClient** by Nick O'Leary
- **WiFiClientSecure** (built-in for secure TLS)

### Optional: Add TLS Support
For production, use secure connection (port 8883 with TLS):

```cpp
#include <WiFiClientSecure.h>

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup() {
  espClient.setInsecure(); // For testing only! Add certificate in production
  // ... rest of setup
}
```

### Upload to ESP32
1. Open Arduino IDE
2. Select Board: "ESP32 Dev Module"
3. Select Port: Your ESP32 COM port
4. Update credentials in the code
5. Click Upload

---

## Testing

### Local Testing
```bash
npm run dev
```
Visit: http://localhost:5174

### Check MQTT Connection
1. Open browser console (F12)
2. Look for "MQTT Connected" message
3. Check for incoming sensor data

### Monitor ESP32
1. Open Arduino IDE Serial Monitor (115200 baud)
2. Check for:
   - WiFi connection
   - MQTT connection
   - Data publishing logs

---

## Production Checklist

- [ ] HiveMQ credentials added to config files
- [ ] ESP32 WiFi credentials updated
- [ ] ESP32 code uploaded and tested
- [ ] Web app tested locally
- [ ] Environment variables configured
- [ ] Deployed to hosting platform
- [ ] MQTT connection verified in production
- [ ] Sensor data flowing correctly

---

## Troubleshooting

### MQTT Connection Failed
- Verify HiveMQ credentials are correct
- Check broker URL and port (8884 for WSS)
- Ensure username/password are set in config

### ESP32 Not Connecting
- Verify WiFi credentials
- Check serial monitor for error messages
- Try restarting ESP32
- Verify MQTT broker is accessible

### No Sensor Data
- Check ESP32 serial monitor
- Verify sensor wiring
- Check MQTT topics match in both ESP32 and web app
- Test with MQTT Explorer tool

---

## Support

For issues:
1. Check [HiveMQ Cloud Status](https://status.hivemq.com/)
2. Review console logs
3. Test with MQTT Explorer desktop app
4. Check GitHub repository issues

---

**Repository**: https://github.com/Jos-zenith/soilsense
**Cluster URL**: bec6e48a9b5e4d27860b9d4d491e6d88.s1.eu.hivemq.cloud
