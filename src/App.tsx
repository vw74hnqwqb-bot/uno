import { useState } from 'react';
import { WifiConfig, LogEntry } from './types';
import ControlCenter from './components/ControlCenter';
import ArduinoCodeGenerator from './components/ArduinoCodeGenerator';
import WiringGuide from './components/WiringGuide';
import SingleFileExport from './components/SingleFileExport';
import { Cpu, Github, HelpCircle, Layers, Settings, MessageSquareShare } from 'lucide-react';

export default function App() {
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    ssid: '',
    password: '',
    ipAddress: '192.168.1.15',
    port: 80,
  });

  const [isPinOn, setIsPinOn] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
      message: '🚀 아두이노 11번 핀 제어 대시보드가 성공적으로 로드되었습니다.',
    },
    {
      id: 'init-info-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'ℹ️ ESP-01 모듈용 코드를 작성해 회로와 일치시킨 뒤, 생성된 IP 주소를 기입해 제어하세요.',
    },
    {
      id: 'init-info-2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: '🔌 브라우저의 Web Serial 통신을 사용하면 별도의 Wi-Fi 설정 없이 USB를 직접 꽂아 정밀 제어할 수도 있습니다.',
    }
  ]);

  const handleAddLog = (type: LogEntry['type'], message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans flex flex-col justify-between">
      
      {/* 1. Header Area with modern Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
                아두이노 11번 핀 제어 대시보드
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">ESP-01 Wi-Fi 무선 제어 및 Web Serial USB 제어 지원</p>
            </div>
          </div>

          {/* Nav links to internal sections */}
          <div className="hidden md:flex items-center gap-5 text-sm font-semibold text-slate-500">
            <button 
              onClick={() => scrollToSection('control-panel')} 
              className="hover:text-indigo-600 transition flex items-center gap-1"
            >
              <Cpu className="w-4 h-4" />
              스위치 패널
            </button>
            <button 
              onClick={() => scrollToSection('code-generator')} 
              className="hover:text-indigo-600 transition flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              스케치 소스코드
            </button>
            <button 
              onClick={() => scrollToSection('wiring-guide')} 
              className="hover:text-indigo-600 transition flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" />
              배선 피드
            </button>
            <button 
              onClick={() => scrollToSection('github-deployment')} 
              className="hover:text-indigo-600 transition flex items-center gap-1"
            >
              <MessageSquareShare className="w-4 h-4" />
              배포 다운로더
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-10 w-full">
        
        {/* Intro Card */}
        <div className="bg-linear-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle gradient pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_60%)]"></div>
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold font-mono">
              DEVELOPER KIT V1.0
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              아두이노에 무선 숨결을, ESP-01 스마트 제어
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              본 웹앱은 저렴하고 뛰어난 <strong>ESP-01 (ESP8266) Wi-Fi 모듈</strong>을 이용하여 아두이노의 11번 핀에 연결된 LED 및 디지털 릴레이 기기를 실시간 통신 제어하기 위해 빌드되었습니다. 
              <br />
              사용자는 아래 대시보드 조작과 동시에 아두이노 하드웨어 동작 매칭용 C++ 코드를 실시간 커스텀 조회할 수 있으며, <strong>싱글파일(Single HTML)로 변환해 GitHub Pages에 1초 만에 무료 배포</strong>할 수 있습니다.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-3.5 w-full md:w-auto">
            <button 
              onClick={() => scrollToSection('code-generator')}
              className="px-5 py-3 bg-white text-indigo-950 rounded-2xl font-bold hover:bg-slate-50 hover:scale-102 transition duration-200 text-center text-sm shadow-md"
            >
              아두이노 C++ 코드 조회
            </button>
            <button 
              onClick={() => scrollToSection('github-deployment')}
              className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 hover:scale-102 transition duration-200 text-center text-sm border border-indigo-500/30"
            >
              깃허브 배포용 파일 다운로드
            </button>
          </div>
        </div>

        {/* Section 1: Dashboard Switch & Simulator */}
        <div id="control-panel" className="scroll-mt-24">
          <ControlCenter
            wifiConfig={wifiConfig}
            onWifiConfigChange={setWifiConfig}
            logs={logs}
            onAddLog={handleAddLog}
            onClearLogs={handleClearLogs}
            isPinOn={isPinOn}
            setIsPinOn={setIsPinOn}
          />
        </div>

        {/* Section 2: Arduino Sketch Code Generator */}
        <div className="scroll-mt-24">
          <ArduinoCodeGenerator
            wifiConfig={wifiConfig}
            onWifiConfigChange={setWifiConfig}
          />
        </div>

        {/* Section 3: Hardware Pin Wiring Guide */}
        <div className="scroll-mt-24">
          <WiringGuide />
        </div>

        {/* Section 4: GitHub Deployment Exporter */}
        <div className="scroll-mt-24">
          <SingleFileExport wifiConfig={wifiConfig} />
        </div>

      </main>

      {/* 3. Global Footer with humble details */}
      <footer className="bg-white border-t border-slate-100 py-6 px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center font-mono">
              P
            </div>
            <span>© 2026 Arduino ESP-01 Pin-11 Interactive Wireless Controller. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <a href="#control-panel" className="hover:text-indigo-600 transition">제어 패널</a>
            <a href="#code-generator" className="hover:text-indigo-600 transition">아두이노 코드</a>
            <a href="#wiring-guide" className="hover:text-indigo-600 transition">배선 가이드</a>
            <span>•</span>
            <span className="text-slate-400">오프라인 모드 & GitHub Pages 완벽 대응</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
