import { useState } from 'react';
import { WifiConfig } from '../types';
import { Copy, Check, Code, Cpu, Info, Wifi } from 'lucide-react';

interface ArduinoCodeGeneratorProps {
  wifiConfig: WifiConfig;
  onWifiConfigChange: (config: WifiConfig) => void;
}

export default function ArduinoCodeGenerator({
  wifiConfig,
  onWifiConfigChange,
}: ArduinoCodeGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'espStandalone' | 'arduinoShield' | 'webSerial'>('espStandalone');
  const [copied, setCopied] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. ESP-01 Direct programming code (ESP8266 Core)
  const espStandaloneCode = `/**
 * ESP-01 Standalone 아두이노 스케치 (ESP8266 보드 설정 필요)
 * 핀 설정: ESP-01의 GPIO 2번 핀에 Relay 모듈이나 LED가 연결된 것으로 가정합니다.
 * (또는 ESP-01 TX/RX를 통해 아두이노와 통신할 수 있습니다.)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// Wi-Fi 환경 설정
const char* ssid = "${wifiConfig.ssid || 'YOUR_WIFI_SSID'}";
const char* password = "${wifiConfig.password || 'YOUR_WIFI_PASSWORD'}";

// WebServer 객체 선언 (80 포트)
ESP8266WebServer server(${wifiConfig.port});

// 제어할 핀 정의 (ESP-01에서는 GPIO 2가 가장 적절함)
const int controlPin = 2; 

void handleRoot() {
  String html = "<html><head><meta charset='utf-8'></head><body>";
  html += "<h1>ESP-01 Control Server Running</h1>";
  html += "<p>Pin State: " + String(digitalRead(controlPin) == HIGH ? "ON" : "OFF") + "</p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// 핀 켜기 핸들러
void handlePinOn() {
  digitalWrite(controlPin, HIGH);
  
  // CORS 및 HTTP 응답 (웹브라우저 직접 제어용)
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "LED ON (Pin 11 / GPIO 2)");
}

// 핀 끄기 핸들러
void handlePinOff() {
  digitalWrite(controlPin, LOW);
  
  // CORS 및 HTTP 응답
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "LED OFF (Pin 11 / GPIO 2)");
}

// CORS OPTIONS 통신 처리용 (Preflight 요청 대응)
void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

void setup() {
  Serial.begin(115200);
  delay(10);
  
  pinMode(controlPin, OUTPUT);
  digitalWrite(controlPin, LOW); // 기본 꺼짐 상태

  // Wi-Fi 연결 진행
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("Wi-Fi connected.");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP()); // 이 IP를 웹앱에 입력하세요!

  // 라우팅 경로 지정
  server.on("/", HTTP_GET, handleRoot);
  server.on("/on", HTTP_GET, handlePinOn);
  server.on("/off", HTTP_GET, handlePinOff);
  server.on("/on", HTTP_OPTIONS, handleOptions);
  server.on("/off", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("HTTP Server started");
}

void loop() {
  server.handleClient();
}
`;

  // 2. Arduino Uno + ESP-01 AT Commander (SoftwareSerial)
  const arduinoShieldCode = `/**
 * Arduino Uno + ESP-01 (AT 명령어 제어 방식) 아두이노 스케치
 * ESP-01이 기본 AT 펌웨어 형태일 때, 아두이노가 ESP-01을 제어하여 
 * 웹 서버를 열고 11번 핀을 키고 끄는 방식입니다.
 * 
 * [주의] ESP-01의 TX는 Arduino Pin 2(SoftwareSerial RX)로,
 *       ESP-01의 RX는 Arduino Pin 3(SoftwareSerial TX)로 연결하되,
 *       우노 TX(5V)가 esp-01 RX(3.3V)로 들어갈 때 1k/2k 저항 분배기가 추천됩니다.
 */

#include <SoftwareSerial.h>

// ESP-01과 통신하기 위한 소프트웨어 시리얼 (RX, TX)
SoftwareSerial espSerial(2, 3); 

const int pin11 = 11; // 제어 대상 11번 핀
const char* ssid = "${wifiConfig.ssid || 'YOUR_WIFI_SSID'}";
const char* password = "${wifiConfig.password || 'YOUR_WIFI_PASSWORD'}";

void setup() {
  Serial.begin(9600);      // 아두이노 시리얼 모니터
  espSerial.begin(9600);   // ESP-01 통신 (일반적으로 9600 혹은 115200)

  pinMode(pin11, OUTPUT);
  digitalWrite(pin11, LOW);

  Serial.println("Initializing ESP-01...");
  
  // ESP-01 리셋 및 점검
  sendATCommand("AT+RST", 2000);
  sendATCommand("AT+CWMODE=1", 1000); // Station 모드 설정
  
  // Wi-Fi 가입 명령어인 AT+CWJAP 설정
  String connectCommand = "AT+CWJAP=\\"";
  connectCommand += ssid;
  connectCommand += "\\",\\"";
  connectCommand += password;
  connectCommand += "\\"";
  sendATCommand(connectCommand, 6000); // 연결 시간이 소요됨
  
  // 현재 IP 조회
  sendATCommand("AT+CIFSR", 2000);
  
  // 다중 접속 모드 활성화
  sendATCommand("AT+CIPMUX=1", 1000);
  
  // 서버 열기 (포트 80)
  sendATCommand("AT+CIPSERVER=1,${wifiConfig.port}", 1000);
  
  Serial.println("ESP-01 setup finished! Wait for requests...");
}

void loop() {
  if (espSerial.available()) {
    if (espSerial.find("+IPD,")) { // 들어오는 데이터 탐색
      delay(300);
      
      int connectionId = espSerial.read() - 48; // 접속 커넥션 ID 변환
      
      // 요청 문자열 조사
      String req = "";
      while(espSerial.available()) {
        char c = espSerial.read();
        req += c;
      }
      
      Serial.print("Request Received: ");
      Serial.println(req);
      
      // 요청 파싱 후 11번 핀 제어
      if (req.indexOf("/on") != -1) {
        digitalWrite(pin11, HIGH);
        sendHTTPResponse(connectionId, "LED 11 ON SUCCESS");
        Serial.println("Pin 11: ON");
      } 
      else if (req.indexOf("/off") != -1) {
        digitalWrite(pin11, LOW);
        sendHTTPResponse(connectionId, "LED 11 OFF SUCCESS");
        Serial.println("Pin 11: OFF");
      }
      else {
        sendHTTPResponse(connectionId, "ESP-01 Pin 11 Server Running");
      }
    }
  }
}

// AT 명령어 송신 전용 함수
void sendATCommand(String command, const int timeout) {
  espSerial.println(command);
  long int time = millis();
  while ((time + timeout) > millis()) {
    while (espSerial.available()) {
      char c = espSerial.read();
      Serial.write(c);
    }
  }
}

// HTTP CORS 대응 응답 전송부
void sendHTTPResponse(int connectionId, String payload) {
  String response = "HTTP/1.1 200 OK\\r\\n";
  response += "Content-Type: text/plain\\r\\n";
  response += "Access-Control-Allow-Origin: *\\r\\n"; // CORS 에러 방지 핵심
  response += "Content-Length: " + String(payload.length()) + "\\r\\n";
  response += "Connection: close\\r\\n\\r\\n";
  response += payload;
  
  String cipSend = "AT+CIPSEND=";
  cipSend += connectionId;
  cipSend += ",";
  cipSend += response.length();
  
  sendATCommand(cipSend, 500);
  espSerial.print(response);
  delay(100);
  
  String cipClose = "AT+CIPCLOSE=";
  cipClose += connectionId;
  sendATCommand(cipClose, 500);
}
`;

  // 3. Web Serial USB protocol
  const webSerialCode = `/**
 * Simple USB Web Serial 아두이노 스케치 (Arduino UNO/Mega 등 공용)
 * 
 * 브라우저에서 '1' 문자열을 보내면 11번 핀이 켜지고,
 * '0' 문자열을 보내면 11번 핀이 꺼집니다.
 * 이 방식은 별도의 Wi-Fi 환경이 없어도 USB 연결만으로 실시간 제어가 가능합니다.
 * (오프라인/로컬/GitHub Pages(HTTPS) 완벽 지원!)
 */

const int pin11 = 11; // 제어할 11번 핀

void setup() {
  // 웹 앱과 매칭할 보드레이트 통신 속도 설정
  Serial.begin(9600);
  
  pinMode(pin11, OUTPUT);
  digitalWrite(pin11, LOW); // 처음엔 OFF
  
  Serial.println("Arduino Serial Pin 11 Controller Ready.");
}

void loop() {
  // PC 시리얼 버퍼에 데이터가 수신되었는지 확인
  if (Serial.available() > 0) {
    char command = Serial.read(); // 바이트 읽기
    
    if (command == '1') {
      digitalWrite(pin11, HIGH);
      Serial.println("PIN11_ON_CONFIRM"); // 웹브라우저로 상태 수신확인 반향
    } 
    else if (command == '0') {
      digitalWrite(pin11, LOW);
      Serial.println("PIN11_OFF_CONFIRM");
    }
  }
}
`;

  const getCodeText = () => {
    switch (activeTab) {
      case 'espStandalone':
        return espStandaloneCode;
      case 'arduinoShield':
        return arduinoShieldCode;
      case 'webSerial':
        return webSerialCode;
    }
  };

  return (
    <div id="code-generator" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-500" />
            아두이노 소스코드 자동 생성
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">원하는 제어 방식의 코드를 확인하고 아두이노에 업로드하세요.</p>
        </div>
        
        {/* Toggle choices */}
        <div className="flex p-1 bg-slate-100 rounded-xl gap-1 text-sm font-medium">
          <button
            onClick={() => setActiveTab('espStandalone')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'espStandalone'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            ESP-01 단독 구동
          </button>
          <button
            onClick={() => setActiveTab('arduinoShield')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'arduinoShield'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            우노 + ESP-01 쉴드
          </button>
          <button
            onClick={() => setActiveTab('webSerial')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'webSerial'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Web Serial (USB 제어)
          </button>
        </div>
      </div>

      {activeTab !== 'webSerial' && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Wi-Fi 이름 (SSID)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Wifi className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="공유기 Wi-Fi 이름 입력"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
                value={wifiConfig.ssid}
                onChange={(e) => onWifiConfigChange({ ...wifiConfig, ssid: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Wi-Fi 비밀번호</label>
            <input
              type="password"
              placeholder="Wi-Fi 비밀번호 입력"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
              value={wifiConfig.password || ''}
              onChange={(e) => onWifiConfigChange({ ...wifiConfig, password: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Code Area Wrapper */}
      <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 group">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700/50">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400 text-xs font-mono ml-2">
              {activeTab === 'espStandalone' ? 'ESP01_Standalone_Server.ino' : activeTab === 'arduinoShield' ? 'Uno_ESP01_Shield.ino' : 'Arduino_WebSerial.ino'}
            </span>
          </div>
          <button
            onClick={() => handleCopy(getCodeText())}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-md transition duration-150"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>스케치 복사하기</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="max-h-[380px] overflow-y-auto font-mono text-xs md:text-sm text-slate-250 leading-relaxed p-4 pointer-events-auto select-text scrollbar-thin scrollbar-thumb-slate-800">
          <pre className="text-slate-300"><code>{getCodeText()}</code></pre>
        </div>
      </div>

      <div className="mt-4 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 text-indigo-900 text-xs leading-relaxed">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" />
        <div>
          {activeTab === 'espStandalone' && (
            <p>
              <strong>ESP-01 단독 구동:</strong> 아두이노 우노 없이 ESP-01 모듈 자체의 프로세서를 빌드에 직접 활용하는 방법입니다. 아두이노 IDE에서 <strong>'ESP8266 Boards' (Generic ESP8266 Module)</strong> 패키지 설치가 필요하며, 핀 매칭상 <strong>GPIO 2</strong>를 LED/릴레이에 할당하여 제어합니다.
            </p>
          )}
          {activeTab === 'arduinoShield' && (
            <p>
              <strong>우노 + ESP-01 쉴드:</strong> 아두이노와 ESP-01을 시리얼(Serial) 연결하여 사용합니다. ESP-01은 웹서버로서 사용자 명령(CORS 허용)을 받아 아두이노에 시그널을 중계하고, 아두이노는 직접 11번 핀에 연결된 디지털 핀을 ON/OFF 합니다.
            </p>
          )}
          {activeTab === 'webSerial' && (
            <p>
              <strong>Web Serial (USB 제어):</strong> 브라우저에서 직접 USB 포트(COM 포트)를 열어 명령어를 통째로 가상 시리얼로 전송합니다. 와이파이 네트워크나 모듈 연결 과정 없이 인터넷만 되면 바로 11번 핀에 불을 켤 수 있으며 크롬(Chrome) 및 엣지(Edge) 기반 브라우저 스마트기기에서 완벽 지원됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
