import { useState, useEffect, useRef } from 'react';
import { WifiConfig, LogEntry, ConnectionMode } from '../types';
import { Play, Square, Wifi, Usb, Send, AlertCircle, RefreshCw, Layers, CheckCircle2, Terminal } from 'lucide-react';

interface ControlCenterProps {
  wifiConfig: WifiConfig;
  onWifiConfigChange: (config: WifiConfig) => void;
  logs: LogEntry[];
  onAddLog: (type: LogEntry['type'], message: string) => void;
  onClearLogs: () => void;
  isPinOn: boolean;
  setIsPinOn: (on: boolean) => void;
}

export default function ControlCenter({
  wifiConfig,
  onWifiConfigChange,
  logs,
  onAddLog,
  onClearLogs,
  isPinOn,
  setIsPinOn,
}: ControlCenterProps) {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('wifi');
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  
  // Serial API States
  const [isSerialConnected, setIsSerialConnected] = useState<boolean>(false);
  const [serialPortName, setSerialPortName] = useState<string>('');
  
  const serialPortRef = useRef<any>(null);
  const serialWriterRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);

  // Check if browser supports Web Serial
  const isSerialSupported = typeof window !== 'undefined' && 'serial' in navigator;

  // Clean up serial connection on unmount
  useEffect(() => {
    return () => {
      if (serialPortRef.current) {
        disconnectSerial();
      }
    };
  }, []);

  const appendToLogs = (type: LogEntry['type'], message: string) => {
    onAddLog(type, message);
  };

  // 1. ESP-01 WiFi HTTP Command Sending
  const sendWifiCommand = async (state: boolean) => {
    setIsSending(true);
    const endpoint = state ? 'on' : 'off';
    const targetUrl = `http://${wifiConfig.ipAddress}:${wifiConfig.port}/${endpoint}`;
    
    appendToLogs('sent', `GET ${targetUrl}`);

    if (isSimulated) {
      // Simulator mode delay
      setTimeout(() => {
        setIsPinOn(state);
        setIsSending(false);
        appendToLogs('success', `[실시간 시뮬레이션] ESP-01이 성공적으로 응답하여 11번 핀이 ${state ? '켜졌습니다 (HIGH)' : '꺼졌습니다 (LOW)'}.`);
      }, 500);
      return;
    }

    // Real Mode - trigger HTTP fetch
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(targetUrl, {
        method: 'GET',
        mode: 'cors', // Enable CORS
        signal: controller.signal
      });

      clearTimeout(id);

      if (response.ok) {
        const text = await response.text();
        setIsPinOn(state);
        appendToLogs('received', `HTTP ${response.status} - ${text}`);
        appendToLogs('success', `아두이노 11번 핀이 성공적으로 ${state ? '켜졌습니다' : '꺼졌습니다'}.`);
      } else {
        throw new Error(`서버 응답 상태코드 오류: ${response.status}`);
      }
    } catch (err: any) {
      console.error(err);
      appendToLogs('error', `오류 발생: ${err.message || '네트워크 연결 실패'}`);
      
      // HTTPS/Mixed Content Warnings
      if (window.location.protocol === 'https:') {
        appendToLogs('error', `🚫 HTTPS 보안 보안 진단: 현재 사이트가 보안 연결(HTTPS)입니다. 브라우저 보안 규정상 로컬 사설망 HTTP 통신(ESP-01의 http://${wifiConfig.ipAddress})은 기본적으로 차단됩니다.`);
        appendToLogs('info', `💡 해결책 1: 로컬에서 index.html 파일을 수동으로 다운로드 후 직접 더블클릭해서 실행(file:// 주소)하면 오류 없이 정상 제어됩니다!`);
        appendToLogs('info', `💡 해결책 2: 상단의 [시뮬레이터 모드] 활성화 시 작동 방식을 그대로 모의 작동해볼 수 있습니다.`);
      } else {
        appendToLogs('info', `💡 해결책: ESP-01 모듈의 전원이 켜져 있고 아두이노와 동일한 공유기(Wi-Fi) 배포망에 연결되었는지, 혹은 소스코드에 알맞은 IP 주소가 들어갔는지 확인하세요.`);
      }
    } finally {
      setIsSending(false);
    }
  };

  // 2. Web Serial Connection (USB)
  const connectSerial = async () => {
    if (!isSerialSupported) return;
    
    try {
      appendToLogs('info', '아두이노 USB 시리얼 포트 연결 시도 중...');
      
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      serialPortRef.current = port;
      setIsSerialConnected(true);
      setSerialPortName('Arduino USB connected');
      appendToLogs('success', '🔌 아두이노와 연결되었습니다! 가상 USB 시리얼 통신(9600 bps)이 수립되었습니다.');

      // Prepare writer
      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
      const writer = textEncoder.writable.getWriter();
      serialWriterRef.current = { writer, writableStreamClosed };

      // Read responses (Async loop in background)
      readSerialData(port);
    } catch (err: any) {
      console.error(err);
      appendToLogs('error', `시리얼 연결 실패: ${err.message || '사용자가 컴포트를 승인하지 않았거나 장치를 찾을 수 없습니다.'}`);
    }
  };

  const disconnectSerial = async () => {
    try {
      if (serialWriterRef.current) {
        await serialWriterRef.current.writer.close();
        serialWriterRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
      setIsSerialConnected(false);
      setSerialPortName('');
      appendToLogs('info', '🔌 USB 시리얼 연결이 단절되었습니다.');
    } catch (err: any) {
      console.error(err);
    }
  };

  const readSerialData = async (port: any) => {
    try {
      while (port.readable && isSerialConnected) {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        serialReaderRef.current = { reader, readableStreamClosed };

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              const msg = value.trim();
              appendToLogs('received', `[RX] 아두이노 응답: ${msg}`);
              if (msg.includes('PIN11_ON_CONFIRM')) {
                setIsPinOn(true);
                appendToLogs('success', '💡 아두이노 측으로부터 실제 LED 점등 펌웨어 수신 확인완료!');
              } else if (msg.includes('PIN11_OFF_CONFIRM')) {
                setIsPinOn(false);
                appendToLogs('success', '💤 아두이노 측으로부터 실제 LED 소등 펌웨어 수신 확인완료!');
              }
            }
          }
        } catch (error) {
          console.error(error);
          break;
        } finally {
          reader.releaseLock();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendSerialCommand = async (state: boolean) => {
    if (!isSerialConnected || !serialWriterRef.current) {
      appendToLogs('error', '⚠️ 먼저 아두이노 기기 연결하기 버튼을 눌러 USB 포트를 연결하세요.');
      return;
    }

    const val = state ? '1' : '0';
    setIsSending(true);
    appendToLogs('sent', `[TX] 시리얼 명령어 송신: '${val}'`);

    try {
      await serialWriterRef.current.writer.write(val);
      
      // For local fallback feedback, toggle virtual status directly too if the arduino doesn't echo back
      setIsPinOn(state);
    } catch (err: any) {
      appendToLogs('error', `시리얼 전송 오류: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleState = (targetState: boolean) => {
    if (connectionMode === 'wifi') {
      sendWifiCommand(targetState);
    } else {
      sendSerialCommand(targetState);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 1. Control Panel Details */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              아두이노 원격 제어 센터
            </h2>
            
            {/* Simulation toggle for Wi-Fi */}
            {connectionMode === 'wifi' && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600"
                  checked={isSimulated}
                  onChange={(e) => {
                    setIsSimulated(e.target.checked);
                    appendToLogs('info', `모드가 ${e.target.checked ? '[시뮬레이션 모드]' : '[ESP-01 실제 웹서버 HTTP 정밀 통신 모드]'}로 전환되었습니다.`);
                  }}
                />
                <span className="text-xs font-semibold text-slate-500">시뮬레이션 모드</span>
              </label>
            )}
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-xl mb-6">
            <button
              onClick={() => {
                setConnectionMode('wifi');
                appendToLogs('info', 'Wi-Fi (ESP-01) 제어 모드로 변경됨.');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                connectionMode === 'wifi'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wifi className="w-4 h-4" />
              Wi-Fi 무선 제어 (ESP-01)
            </button>
            <button
              onClick={() => {
                setConnectionMode('usb');
                appendToLogs('info', 'USB 시리얼 제어 모드로 변경됨.');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                connectionMode === 'usb'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Usb className="w-4 h-4" />
              USB 유선 제어 (Web Serial)
            </button>
          </div>

          {/* Wi-Fi Parameters */}
          {connectionMode === 'wifi' && (
            <div className={`space-y-4 mb-6 transition-all duration-300 ${isSimulated ? 'opacity-85' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ESP-01 IP 주소</label>
                  <input
                    type="text"
                    placeholder="예: 192.168.1.15"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={wifiConfig.ipAddress}
                    onChange={(e) => onWifiConfigChange({ ...wifiConfig, ipAddress: e.target.value })}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">포트 (Port)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={wifiConfig.port}
                    onChange={(e) => onWifiConfigChange({ ...wifiConfig, port: parseInt(e.target.value) || 80 })}
                  />
                </div>
              </div>
              
              {isSimulated && (
                <div className="p-3 bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-lg text-xs leading-relaxed">
                  📢 <strong>시뮬레이션 구동 중:</strong> 실제 칩 하드웨어가 아직 세팅되지 않았더라도 버튼 조작에 따른 브라우저 제어 효과와 아두이노 회로의 LED 불빛 동작 과정을 고화질 그래픽으로 테스트 가능합니다.
                </div>
              )}
            </div>
          )}

          {/* USB / Web Serial Parameters */}
          {connectionMode === 'usb' && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${isSerialConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      {isSerialConnected ? '아두이노 가상 연결됨' : '아두이노 미연결'}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {isSerialConnected ? serialPortName : '9600 bps - 8-N-1 설정'}
                    </p>
                  </div>
                </div>

                {isSerialSupported ? (
                  isSerialConnected ? (
                    <button
                      onClick={disconnectSerial}
                      className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      연결 해제
                    </button>
                  ) : (
                    <button
                      onClick={connectSerial}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      아두이노 기기 연결
                    </button>
                  )
                ) : (
                  <div className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100 font-semibold max-w-[200px] text-center">
                    브라우저 미지원 (Chrome/Edge 사용)
                  </div>
                )}
              </div>

              {!isSerialSupported && (
                <div className="p-3.5 bg-rose-50 text-rose-900 border border-rose-100 rounded-lg text-xs leading-relaxed flex gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    설치된 브라우저가 <strong>Web Serial API</strong>를 지원하지 않습니다. 
                    USB 시리얼 연결을 직접 제어하려면 크롬(Chrome), 엣지(Edge), 오페라(Opera) 최신 버전을 활용해주세요. Safari나 Firefox에서는 무선 Wi-Fi 제어 모드만 정상 지원됩니다.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trigger Control buttons */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">핀 11 제어 스위치</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={isSending || (connectionMode === 'usb' && !isSerialConnected)}
                onClick={() => handleToggleState(true)}
                className={`flex flex-col items-center justify-center py-5 px-4 rounded-2xl border-2 transition-all duration-300 relative group overflow-hidden ${
                  isPinOn
                    ? 'border-amber-400 bg-amber-50/50 text-amber-800 text-shadow-sm shadow-md'
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform duration-300 ${
                  isPinOn ? 'bg-amber-100 text-amber-600 scale-110 shadow-inner' : 'bg-slate-50 text-slate-400'
                }`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="font-bold text-base">LED 켜기 (ON)</span>
                <span className="text-xs opacity-75 font-mono mt-0.5">PIN 11 HIGH</span>
                {isPinOn && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
              </button>

              <button
                disabled={isSending || (connectionMode === 'usb' && !isSerialConnected)}
                onClick={() => handleToggleState(false)}
                className={`flex flex-col items-center justify-center py-5 px-4 rounded-2xl border-2 transition-all duration-300 ${
                  !isPinOn
                    ? 'border-indigo-400 bg-indigo-50/40 text-indigo-800 shadow-md'
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform duration-300 ${
                  !isPinOn ? 'bg-indigo-100 text-indigo-600 scale-110 shadow-inner' : 'bg-slate-50 text-slate-400'
                }`}>
                  <Square className="w-5 h-5" />
                </div>
                <span className="font-bold text-base">LED 끄기 (OFF)</span>
                <span className="text-xs opacity-75 font-mono mt-0.5">PIN 11 LOW</span>
              </button>
            </div>
          </div>
        </div>

        {/* Console Log Area */}
        <div className="mt-8 bg-slate-900 rounded-xl overflow-hidden shadow-inner flex flex-col h-[180px]">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 font-mono">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>LOG CONSOLE</span>
            </div>
            <button
              onClick={onClearLogs}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 bg-slate-700/50 rounded hover:bg-slate-700 transition"
            >
              콘솔 비우기
            </button>
          </div>
          
          <div className="p-3 overflow-y-auto font-mono text-[11px] leading-relaxed flex-1 space-y-1.5 max-h-[148px] select-text">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">No log entries. Click commands to trigger.</div>
            ) : (
              logs.map((log) => {
                let colorClass = 'text-slate-400';
                if (log.type === 'success') colorClass = 'text-emerald-400';
                if (log.type === 'error') colorClass = 'text-rose-400';
                if (log.type === 'sent') colorClass = 'text-amber-400 font-medium';
                if (log.type === 'received') colorClass = 'text-indigo-400';
                
                return (
                  <div key={log.id} className="flex gap-2 items-start break-all">
                    <span className="text-slate-600 select-none flex-shrink-0">{log.timestamp}</span>
                    <span className={colorClass}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. Visual Breadboard & Hardware Pin Simulation Card */}
      <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
        {/* Glow behind circuit */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none transition-all duration-1000 blur-3xl ${
          isPinOn ? 'bg-amber-500/15 scale-125' : 'bg-transparent scale-75'
        }`}></div>

        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight mb-1 flex items-center gap-1.5 relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            하드웨어 및 핀 매칭 시뮬레이터
          </h2>
          <p className="text-xs text-slate-400 mb-6">회로의 가상 디지털 11번 신호와 매칭 램프를 모니터링합니다.</p>

          {/* Interactive Graphic: Arduino UNO + Breadboard Vector Map */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative z-10 flex flex-col items-center justify-center min-h-[260px]">
            
            {/* The Lightbulb / LED Graphic */}
            <div className="relative mb-8 flex flex-col items-center">
              <div className="relative">
                {/* Yellow light projection ring */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full transition-all duration-500 blur-xl ${
                  isPinOn ? 'bg-amber-400/40 opacity-100' : 'bg-transparent opacity-0'
                }`}></div>
                
                {/* Glowing Core */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center relative border border-slate-700 bg-linear-to-b transition-all duration-500 ${
                  isPinOn 
                    ? 'from-amber-200 to-amber-500 text-amber-950 shadow-[0_0_40px_rgba(245,158,11,0.5)]' 
                    : 'from-slate-800 to-slate-900 text-slate-600'
                }`}>
                  <svg className="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v2m0 0h2m-2 0H10m2-16a6 6 0 100 12h0a6 6 0 000-12zM12 13V9" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition ${
                  isPinOn ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isPinOn ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
                  Digital PIN 11: {isPinOn ? 'HIGH (VCC/3.3V-5V)' : 'LOW (GND/0V)'}
                </span>
              </div>
            </div>

            {/* Wire lines connecting Arduino to ESP8266 or basic circuit indicator */}
            <div className="w-full space-y-3.5 text-xs text-slate-300 font-mono bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-500">통신 장치 종류:</span>
                <span className="font-bold text-slate-200">{connectionMode === 'wifi' ? 'ESP-01 WiFi Module' : 'USB Serial Engine'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-500">프로토콜 통신:</span>
                <span className="text-indigo-400 font-bold">{connectionMode === 'wifi' ? 'HTTP/GET WebServer' : 'CDC Virtual COM Port'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">물리적 메인보드:</span>
                <span className="text-emerald-400 font-bold">Arduino UNO/Mega v3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safe Guide Reminder Box */}
        <div className="mt-6 border-t border-slate-800 pt-5 text-xs text-slate-400 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-200">📌 꼭 확인하세요!</p>
          <p>
            아두이노의 <strong>디지털 11번 핀</strong>은 물리적 회로 세팅 시 전류 보호용 <strong>220Ω~330Ω 저항</strong>과 함께 LED 전구의 긴 다리(+)를 연결하고, 다른 짧은 다리(-)는 아두이노의 <strong>GND 핀</strong>에 꽂아 연결해주면 실제 하드웨어가 완벽하게 동작합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
