#include "ESP_I2S.h"
#include "FS.h"
#include "SD.h"
#include "SPI.h"
#include "Wire.h"
#include "WiFi.h"
#include "HTTPClient.h"
#include "esp_camera.h"


// Device and network configuration
#define I2C_DEV_ADDR 0x55

// Create an instance of the I2SClass
I2SClass i2s;


const char* boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
const char* server   = "10.19.180.177";
const int   serverPort = 8000;

// Buffer size for collecting samples
#define BUFFER_SIZE 1024
int16_t sampleBuffer[BUFFER_SIZE];
int buffIndex = 0;

#define WIFI_SSID "Treehacks-2025"      // Replace with your WiFi SSID
#define WIFI_PASSWORD "treehacks2025!"  // Replace with your WiFi password

const char* server2 = "http://10.19.180.177:8000/badge-scan/";  // Server URLURL

// Global state flags (used for our simple state machine)
bool recording = false;
String lastCommand = "";
volatile bool startRecordingFlag = false;
volatile bool stopRecordingFlag  = false;

// Camera pin configuration for XIAO ESP32S3
#define PWDN_GPIO_NUM    -1
#define RESET_GPIO_NUM   -1
#define XCLK_GPIO_NUM    10
#define SIOD_GPIO_NUM    40
#define SIOC_GPIO_NUM    39
#define Y9_GPIO_NUM      48
#define Y8_GPIO_NUM      11
#define Y7_GPIO_NUM      12
#define Y6_GPIO_NUM      14
#define Y5_GPIO_NUM      16
#define Y4_GPIO_NUM      18
#define Y3_GPIO_NUM      17
#define Y2_GPIO_NUM      15
#define VSYNC_GPIO_NUM   38
#define HREF_GPIO_NUM    47
#define PCLK_GPIO_NUM    13

// --- Utility Function ---
String removeSpecialChars(String input) {
  String output = "";
  for (int i = 0; i < input.length(); i++) {
    char c = input[i];
    if (isAlphaNumeric(c)) {  // Keep only letters and numbers
      output += c;
    }
  }
  return output;
}

void onReceive(int len) {
  String command = "";
  while (Wire.available()) {
    char c = Wire.read();
    command += c;
  }
  String clean_data = removeSpecialChars(command);
  Serial.print("rfid: ");
  Serial.println(clean_data);

  // If not recording and a new valid command is received, signal start.
  if (clean_data != "" && clean_data != lastCommand) {
    lastCommand = clean_data;
    startRecordingFlag = true;


  }
  // If already recording and a (repeated) command is received, signal stop.
  else {

    startRecordingFlag = false;
    sendGetRequest(clean_data);
    lastCommand = "";
  }
}

void sendGetRequest(String data) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    String url = server + data;
    Serial.print("Sending request to: ");
    Serial.println(server2);

    http.begin(url);  // Start HTTP connection
    int httpCode = http.GET();  // Send GET request

    if (httpCode > 0) {  // Check for a valid response
      Serial.print("Response Code: ");
      Serial.println(httpCode);
      String payload = http.getString();
      Serial.println("Server Response: " + payload);
    } else {
      Serial.print("Error on HTTP request: ");
      Serial.println(httpCode);
    }

    http.end();  // Close connection
  } else {
    Serial.println("WiFi not connected!");
  }
}

// --- WiFi Connection ---
void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}


void setup() {
  // Initialize the serial port
  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }

  Serial.println("Initializing I2S bus...");

  // Set up the pins used for audio input
  i2s.setPinsPdmRx(42, 41);

  // start I2S at 16 kHz with 16-bits per sample
  if (!i2s.begin(I2S_MODE_PDM_RX, 16000, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO)) {
    Serial.println("Failed to initialize I2S!");
    while (1); // do nothing
  }

  Serial.println("I2S bus initialized.");
  Serial.println("Initializing SD card...");

  Wire.onReceive(onReceive);
  Wire.begin((uint8_t)I2C_DEV_ADDR);

  // Set up the pins used for SD card access
  if (!SD.begin(21)) {
    Serial.println("Failed to mount SD Card!");
    while (1);
  }

  Serial.println("SD card initialized.");

  // Initialize Camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 8;
  config.fb_count = 2;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera initialization failed");
    return;
  }
  Serial.println("Camera initialized.");
}


void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  if (startRecordingFlag) {
    //----------------------------------------
    // Create a file on the SD card for raw data
    File file = SD.open("/audio_raw.dat", FILE_WRITE);
    if (!file) {
      Serial.println("Failed to open file for writing!");
      return;
    }

    File vidFile = SD.open("/video.raw", FILE_WRITE);
    if (!vidFile) {
      Serial.println("Failed to open video file for recording!");
      vidFile.close();
      return;
    }


    Serial.println("Recording session started...");

    // For periodic video frame capture
    unsigned long lastFrameTime = millis();

    while (startRecordingFlag) {
      int sample = i2s.read();

      if (sample && sample != -1 && sample != 1) {
        // Store sample in buffer
        sampleBuffer[buffIndex] = (int16_t)sample;
        buffIndex++;

        // When buffer is full, write to SD card
        if (buffIndex >= BUFFER_SIZE) {
          file.write((const uint8_t*)sampleBuffer, BUFFER_SIZE * sizeof(int16_t));
          buffIndex = 0;

          // Print progress
          //          Serial.printf("Recording: %d seconds...\n", (millis() - startTime) / 1000);
        }
      }


      // --- Video Capture ---
      // Capture a frame roughly every 100ms
      if (millis() - lastFrameTime > 100) {
        camera_fb_t *fb = esp_camera_fb_get();
        if (fb) {
          uint32_t frame_size = fb->len;
          // Write the size of the frame followed by the frame data
          vidFile.write((uint8_t*)&frame_size, sizeof(frame_size));
          vidFile.write(fb->buf, fb->len);
          esp_camera_fb_return(fb);
        }
        lastFrameTime = millis();
      }
    }

    // Write any remaining samples in buffer
    if (buffIndex > 0) {
      file.write((const uint8_t*)sampleBuffer, buffIndex * sizeof(int16_t));
    }

    // Close the file
    file.close();
    vidFile.close();
    Serial.println("Recording complete!");
    Serial.println("Application complete.");
    //----------------------------------------

    bool success = uploadAndDeleteFile("/audio_raw.dat");
    if (success) {
      Serial.println("Upload1 and deletion completed successfully.");
    } else {
      Serial.println("Upload1 failed; file was not deleted.");
    }

    success = uploadVideo("/video.raw");
    if (success) {
      Serial.println("Upload2 and deletion completed successfully.");
    } else {
      Serial.println("Upload2 failed; file was not deleted.");
    }
  }
}



bool uploadAndDeleteFile(const char* filePath) {
  // Open file from SD card
  File file = SD.open(filePath);
  if (!file) {
    Serial.printf("Failed to open file: %s\n", filePath);
    return false;
  }

  // Extract the filename from the path (e.g., "/path/to/file.m4a" becomes "file.m4a")
  String fullPath = String(filePath);
  int slashIndex = fullPath.lastIndexOf('/');
  String filename = (slashIndex != -1) ? fullPath.substring(slashIndex + 1) : fullPath;

  // Build multipart/form-data header and footer
  String partHeader = "";
  partHeader += "--" + String(boundary) + "\r\n";
  partHeader += "Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n";
  partHeader += "Content-Type: audio/m4a\r\n\r\n"; // change Content-Type if needed

  String partFooter = "\r\n--" + String(boundary) + "--\r\n";

  // Calculate the total content length
  size_t contentLength = partHeader.length() + file.size() + partFooter.length();

  WiFiClient client;
  Serial.printf("Connecting to %s:%d...\n", server, serverPort);
  if (!client.connect(server, serverPort)) {
    Serial.println("Connection failed!");
    file.close();
    return false;
  }

  // Send HTTP request headers
  client.printf("POST /upload-audio HTTP/1.1\r\n");
  client.printf("Host: %s:%d\r\n", server, serverPort);
  client.printf("Content-Type: multipart/form-data; boundary=%s\r\n", boundary);
  client.printf("Content-Length: %d\r\n", contentLength);
  client.print("Connection: close\r\n\r\n");

  // Send multipart header
  client.print(partHeader);

  // Read file and send its content in chunks
  uint8_t buffer[5000];
  while (file.available()) {
    size_t bytesRead = file.read(buffer, sizeof(buffer));
    client.write(buffer, bytesRead);
  }
  file.close();

  // Send multipart footer
  client.print(partFooter);

  // Optional: Read and print server response for debugging
  unsigned long timeout = millis();
  while (!client.available() && (millis() - timeout < 5000)) {
    delay(10);
  }
  Serial.println("Server response:");
  while (client.available()) {
    String line = client.readStringUntil('\n');
    Serial.println(line);
  }
  client.stop();

  // Delete the file if it still exists
  if (SD.exists(filePath)) {
    if (SD.remove(filePath)) {
      Serial.println("File deleted successfully.");
    } else {
      Serial.println("Failed to delete file.");
      // Even if deletion fails, we consider the upload to have been successful.
    }
  }

  return true;
}

bool uploadVideo(const char* filePath) {
  // Open file from SD card
  File file = SD.open(filePath);
  if (!file) {
    Serial.printf("Failed to open file: %s\n", filePath);
    return false;
  }

  // Extract the filename from the path (e.g., "/path/to/file.m4a" becomes "file.m4a")
  String fullPath = String(filePath);
  int slashIndex = fullPath.lastIndexOf('/');
  String filename = (slashIndex != -1) ? fullPath.substring(slashIndex + 1) : fullPath;

  // Build multipart/form-data header and footer
  String partHeader = "";
  partHeader += "--" + String(boundary) + "\r\n";
  partHeader += "Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n";
  partHeader += "Content-Type: audio/m4a\r\n\r\n"; // change Content-Type if needed

  String partFooter = "\r\n--" + String(boundary) + "--\r\n";

  // Calculate the total content length
  size_t contentLength = partHeader.length() + file.size() + partFooter.length();

  WiFiClient client;
  Serial.printf("Connecting to %s:%d...\n", server, serverPort);
  if (!client.connect(server, serverPort)) {
    Serial.println("Connection failed!");
    file.close();
    return false;
  }

  // Send HTTP request headers
  client.printf("POST /upload-video HTTP/1.1\r\n");
  client.printf("Host: %s:%d\r\n", server, serverPort);
  client.printf("Content-Type: multipart/form-data; boundary=%s\r\n", boundary);
  client.printf("Content-Length: %d\r\n", contentLength);
  client.print("Connection: close\r\n\r\n");

  // Send multipart header
  client.print(partHeader);

  // Read file and send its content in chunks
  uint8_t buffer[5000];
  while (file.available()) {
    size_t bytesRead = file.read(buffer, sizeof(buffer));
    client.write(buffer, bytesRead);
  }
  file.close();

  // Send multipart footer
  client.print(partFooter);

  // Optional: Read and print server response for debugging
  unsigned long timeout = millis();
  while (!client.available() && (millis() - timeout < 5000)) {
    delay(10);
  }
  Serial.println("Server response:");
  while (client.available()) {
    String line = client.readStringUntil('\n');
    Serial.println(line);
  }
  client.stop();

  // Delete the file if it still exists
  if (SD.exists(filePath)) {
    if (SD.remove(filePath)) {
      Serial.println("File deleted successfully.");
    } else {
      Serial.println("Failed to delete file.");
      // Even if deletion fails, we consider the upload to have been successful.
    }
  }

  return true;
}