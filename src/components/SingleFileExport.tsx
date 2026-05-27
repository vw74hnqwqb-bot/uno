import { useState } from 'react';
import { WifiConfig } from '../types';
import { Download, FileCode, CheckCircle, Github, Info, Globe } from 'lucide-react';

interface SingleFileExportProps {
  wifiConfig: WifiConfig;
}

export default function SingleFileExport({ wifiConfig }: SingleFileExportProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const generateSingleHtmlFile = () => {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>아두이노 11번 핀 제어기 (ESP-01 / Web Serial)</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between">

    <!-- Header Section -->
    <header class="bg-white border-b border-slate-200 py-5 px-6">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                    A11
                </div>
                <div>
                    <h1 class="text-lg font-bold text-slate-900 tracking-tight">아두이노 11번 핀 제어 시스템</h1>
                    <p class="text-xs text-slate-500">WiFi 및 USB Serial 실시간 컨트롤러</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    GitHub Pages 호환
                </span>
            </div>
        </div>
    </header>

    <!-- Main Section -->
    <main class="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            <!-- Left Panel: Control Switch -->
            <div class="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <h2 class="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                        💡 스마트 제어 센터
                    </h2>

                    <!-- Mode Tab -->
                    <div class="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-6 text-sm font-medium">
                        <button onclick="switchMode('wifi')" id="tab-wifi" class="py-2.5 rounded-lg bg-white text-indigo-600 shadow-sm border border-slate-200/50">
                            📶 WiFi 무선 (ESP-01)
                        </button>
                        <button onclick="switchMode('usb')" id="tab-usb" class="py-2.5 rounded-lg text-slate-600 hover:text-slate-800">
                            🔌 USB 유선 (Serial)
                        </button>
                    </div>

                    <!-- WiFi Panel Settings -->
                    <div id="panel-wifi" class="space-y-4 mb-6">
                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-8">
                                <label class="block text-xs font-semibold text-slate-500 mb-1">ESP-01 IP 주소</label>
                                <input type="text" id="esp-ip" value="${wifiConfig.ipAddress}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition">
                            </div>
                            <div class="col-span-4">
                                <label class="block text-xs font-semibold text-slate-500 mb-1">포트</label>
                                <input type="number" id="esp-port" value="${wifiConfig.port}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition">
                            </div>
                        </div>
                        <div class="p-3 bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-lg text-xs leading-relaxed">
                            💡 <strong>보안 팁:</strong> GitHub Pages는 SSL (HTTPS) 환경이 필수이므로, 안전하지 않은 HTTP 통신(로컬 IP)은 브라우저에서 차단될 수 있습니다. 이를 우회하려면 본 HTML 파일을 PC에서 <strong>더블 클릭하여 로컬 파일(file://)</strong>로 여시면 혼합 콘텐츠(Mixed Content) 오류 없이 정상 작용합니다.
                        </div>
                    </div>

                    <!-- USB Panel Serial Connect -->
                    <div id="panel-usb" class="space-y-4 mb-6 hidden">
                        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <h3 class="text-sm font-semibold text-slate-800" id="usb-status">아두이노 기기 미연결</h3>
                                <p class="text-xs text-slate-400">USB 케이블로 PC와 아두이노를 연결해주세요.</p>
                            </div>
                            <button id="btn-usb-conn" onclick="toggleUsbConnection()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition">
                                아두이노 기기 연결
                            </button>
                        </div>
                        <div id="serial-missing-warning" class="hidden p-3 bg-amber-50 text-amber-900 border border-amber-150 rounded-lg text-xs leading-relaxed">
                            ⚠️ 현재 구동 브라우저는 Web Serial API를 직접 자원하지 않습니다. 크롬(Chrome) 또는 엣지(Edge) 신형을 즐겨보세요!
                        </div>
                    </div>

                    <!-- Toggle buttons -->
                    <div class="grid grid-cols-2 gap-4 mt-8">
                        <button id="btn-on" onclick="controlPin11(true)" class="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 transition-all duration-200">
                            <span class="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-lg mb-2" id="icon-on">1</span>
                            <span class="font-bold text-base">LED 켜기 (ON)</span>
                            <span class="text-xs text-slate-400 font-mono mt-0.5">PIN 11 HIGH</span>
                        </button>

                        <button id="btn-off" onclick="controlPin11(false)" class="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 transition-all duration-200">
                            <span class="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-lg mb-2" id="icon-off">0</span>
                            <span class="font-bold text-base">LED 끄기 (OFF)</span>
                            <span class="text-xs text-slate-400 font-mono mt-0.5">PIN 11 LOW</span>
                        </button>
                    </div>
                </div>

                <!-- Live Log Console -->
                <div class="mt-8 bg-slate-900 rounded-xl overflow-hidden flex flex-col h-[150px]">
                    <div class="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-300 font-mono text-[10px] font-semibold">
                        <span>통신 콘솔 로그</span>
                        <button onclick="clearConsole()" class="text-[9px] hover:text-white bg-slate-700 px-2 py-0.5 rounded">지우기</button>
                    </div>
                    <div id="custom-console" class="p-3 overflow-y-auto font-mono text-[11px] text-slate-400 flex-1 space-y-1 bg-slate-950">
                        <div class="text-slate-500 italic">시스템 준비 완료. 제어 명령을 대기 중입니다...</div>
                    </div>
                </div>
            </div>

            <!-- Right Panel: Visual Device simulation -->
            <div class="md:col-span-5 bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between">
                <div>
                    <h3 class="text-base font-bold text-slate-100 mb-1">실시간 가상 시뮬레이터</h3>
                    <p class="text-xs text-slate-400 mb-6 font-semibold">가상 하드웨어의 LED 회로 핀 상태</p>

                    <div class="bg-black/40 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
                        <!-- Light Bulb -->
                        <div class="relative mb-6">
                            <div id="light-shadow" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full transition-all duration-500 blur-xl bg-transparent"></div>
                            <div id="light-bulb" class="w-16 h-16 rounded-full flex items-center justify-center relative border border-slate-700 bg-slate-800 transition-all duration-500 text-slate-650">
                                <svg class="w-8 h-8 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v2m0 0h2m-2 0H10m2-16a6 6 0 100 12h0a6 6 0 000-12zM12 13V9" />
                                </svg>
                            </div>
                        </div>

                        <span id="pin-status-label" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-500 transition">
                            Digital PIN 11: LOW
                        </span>
                    </div>
                </div>

                <div class="mt-6 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
                    <h4 class="font-bold text-slate-200 mb-1">📌 회로 간편 요약</h4>
                    <p>
                        아두이노의 11번 출력핀 → 220Ω 저항 → LED (+) 긴다리 / (-) 짧은 다리 → 아두이노 GND 순으로 결선하시면 이 웹앱을 통해 전 세계 어디서든 유무선 제어가 직접 완성됩니다.
                    </p>
                </div>
            </div>

        </div>
    </main>

    <!-- Footer Section -->
    <footer class="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500">
        <div class="max-w-5xl mx-auto px-4 flex items-center justify-between flex-wrap gap-2">
            <span>© 2026 Arduino Control Board Dashboard</span>
            <span>Created for ESP-01 & Arduino</span>
        </div>
    </footer>

    <script>
        let isPinOnState = false;
        let mode = 'wifi';
        let serialPort = null;
        let serialWriter = null;

        const isSerialSupported = 'serial' in navigator;
        if (!isSerialSupported) {
            document.getElementById('serial-missing-warning').classList.remove('hidden');
            document.getElementById('btn-usb-conn').disabled = true;
            document.getElementById('btn-usb-conn').classList.add('opacity-50');
        }

        // Output Custom Log Console
        function log(type, message) {
            const consoleEl = document.getElementById('custom-console');
            
            // Clear default message
            if (consoleEl.children.length === 1 && consoleEl.children[0].classList.contains('italic')) {
                consoleEl.innerHTML = '';
            }

            const now = new Date().toLocaleTimeString();
            let colorMap = {
                sent: 'text-amber-400 font-semibold',
                received: 'text-indigo-400',
                success: 'text-emerald-400',
                error: 'text-rose-400',
                info: 'text-slate-400'
            };

            const line = document.createElement('div');
            line.className = 'flex gap-2 items-start text-xs';
            line.innerHTML = \`<span class="text-slate-650 shrink-0">\${now}</span><span class="\${colorMap[type] || 'text-slate-400'}">\${message}</span>\`;
            
            consoleEl.appendChild(line);
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }

        function clearConsole() {
            document.getElementById('custom-console').innerHTML = '<div class="text-slate-500 italic">로그 기록이 초기화되었습니다.</div>';
        }

        // Mode Toggler
        function switchMode(newMode) {
            mode = newMode;
            const tabWifi = document.getElementById('tab-wifi');
            const tabUsb = document.getElementById('tab-usb');
            const panelWifi = document.getElementById('panel-wifi');
            const panelUsb = document.getElementById('panel-usb');

            if (newMode === 'wifi') {
                tabWifi.className = "py-2.5 rounded-lg bg-white text-indigo-600 shadow-sm border border-slate-200/50";
                tabUsb.className = "py-2.5 rounded-lg text-slate-600 hover:text-slate-800";
                panelWifi.classList.remove('hidden');
                panelUsb.classList.add('hidden');
                log('info', 'Wi-Fi 제어 모드로 변경되었습니다.');
            } else {
                tabUsb.className = "py-2.5 rounded-lg bg-white text-indigo-600 shadow-sm border border-slate-200/50";
                tabWifi.className = "py-2.5 rounded-lg text-slate-600 hover:text-slate-800";
                panelUsb.classList.remove('hidden');
                panelWifi.classList.add('hidden');
                log('info', 'USB Serial 제어 모드로 변경되었습니다.');
            }
        }

        // Web Serial Logic
        async function toggleUsbConnection() {
            if (!isSerialSupported) return;

            if (serialPort) {
                // Disconnect
                try {
                    if (serialWriter) {
                        await serialWriter.close();
                        serialWriter = null;
                    }
                    await serialPort.close();
                    serialPort = null;
                    document.getElementById('usb-status').innerText = '아두이노 기기 미연결';
                    document.getElementById('btn-usb-conn').innerText = '아두이노 기기 연결';
                    document.getElementById('btn-usb-conn').classList.add('bg-indigo-600');
                    document.getElementById('btn-usb-conn').classList.remove('bg-rose-600');
                    log('info', '우노 시리얼 연결이 해제되었습니다.');
                } catch (e) {
                    log('error', '연결 해제 오차: ' + e.message);
                }
                return;
            }

            try {
                log('info', 'USB 시리얼 포트 브라우저 요청 중...');
                serialPort = await navigator.serial.requestPort();
                await serialPort.open({ baudRate: 9600 });

                document.getElementById('usb-status').innerText = '아두이노 가상 연결됨 (9600 bps)';
                document.getElementById('btn-usb-conn').innerText = '아두이노 연결 해제';
                document.getElementById('btn-usb-conn').classList.remove('bg-indigo-600');
                document.getElementById('btn-usb-conn').classList.add('bg-rose-500');
                
                const encoder = new TextEncoderStream();
                const writableStreamClosed = encoder.readable.pipeTo(serialPort.writable);
                serialWriter = encoder.writable.getWriter();
                
                log('success', '🔌 아두이노 기기가 정상적으로 연결되었습니다!');
                
                // Keep reading loop
                readSerialStream();
            } catch (err) {
                log('error', '포트 가입 실패: ' + err.message);
                serialPort = null;
            }
        }

        async function readSerialStream() {
            try {
                while (serialPort && serialPort.readable) {
                    const decoder = new TextDecoderStream();
                    const readableStreamClosed = serialPort.readable.pipeTo(decoder.writable);
                    const reader = decoder.readable.getReader();

                    try {
                        while (true) {
                            const { value, done } = await reader.read();
                            if (done) break;
                            if (value) {
                                const cleanMsg = value.trim();
                                log('received', '[RX] 아두이노: ' + cleanMsg);
                                if (cleanMsg.includes('PIN11_ON_CONFIRM')) {
                                    setVisualState(true);
                                    log('success', '💡 실제 LED 켜짐 응답 확인!');
                                } else if (cleanMsg.includes('PIN11_OFF_CONFIRM')) {
                                    setVisualState(false);
                                    log('success', '💤 실제 LED 꺼짐 응답 확인!');
                                }
                            }
                        }
                    } catch (e) {
                        break;
                    } finally {
                        reader.releaseLock();
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }

        // Core Control Dispatcher
        async function controlPin11(state) {
            if (mode === 'wifi') {
                // WiFi Fetch Request
                const ip = document.getElementById('esp-ip').value.trim();
                const portVal = document.getElementById('esp-port').value.trim();
                if (!ip) {
                    log('error', 'ESP-01의 올바른 IP 주소를 기입해 주세요.');
                    return;
                }
                const route = state ? 'on' : 'off';
                const url = \`http://\${ip}:\${portVal}/\${route}\`;
                
                log('sent', 'GET ' + url + ' 송신 시도...');
                
                try {
                    // Start an abort timeout of 3.5 seconds
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3500);

                    const res = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const txt = await res.text();
                        log('received', 'HTTP ' + res.status + ' - ' + txt);
                        setVisualState(state);
                        log('success', '아두이노 11번 핀이 원격으로 ' + (state ? '점등(HIGH)' : '소등(LOW)') + ' 되었습니다!');
                    } else {
                        throw new Error('서버 에러코드 발생: ' + res.status);
                    }
                } catch (e) {
                    log('error', '네트워크 통신 불가: ' + e.message);
                    
                    // Detail browser CORS issue warn
                    if (window.location.protocol === 'https:') {
                        log('error', '🚫 보안 경고: 현재 페이지가 보안주소(HTTPS)이므로 일반 사설 HTTP(ESP-01) 제어를 차단하고 있습니다.');
                        log('info', '💡 간단 해결: 본 HTML을 로컬 컴퓨터에 저장한 뒤 파일 더블클릭(file://)형태로 구동하시면 우회 정밀 제어가 마법같이 성공합니다!');
                    }
                    
                    // Set status dynamically as simulated backup if offline testing
                    setVisualState(state);
                    log('info', '(로컬 시뮬레이션 상태 변경 완료)');
                }
            } else {
                // USB Serial Send
                if (!serialPort || !serialWriter) {
                    log('error', '⚠️ 먼저 우측 연동 패널에서 [아두이노 기기 연결] 포트 등록을 완료해주세요.');
                    return;
                }
                try {
                    const charCmd = state ? '1' : '0';
                    log('sent', '[TX] USB Serial 명령어 발신: ' + charCmd);
                    await serialWriter.write(charCmd);
                    
                    // Directly change visual state if no loop reflection needed
                    setVisualState(state);
                } catch (e) {
                    log('error', '시리얼 명령어 송신 오류: ' + e.message);
                }
            }
        }

        // Update bulb visuals
        function setVisualState(state) {
            isPinOnState = state;
            const shadow = document.getElementById('light-shadow');
            const bulb = document.getElementById('light-bulb');
            const label = document.getElementById('pin-status-label');
            const btnOn = document.getElementById('btn-on');
            const btnOff = document.getElementById('btn-off');
            const iconOn = document.getElementById('icon-on');
            const iconOff = document.getElementById('icon-off');

            if (state) {
                // On visual
                shadow.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full transition-all duration-500 blur-xl bg-amber-400/40";
                bulb.className = "w-16 h-16 rounded-full flex items-center justify-center relative border border-amber-300 bg-gradient-to-b from-amber-200 to-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.5)] text-amber-950 transition-all duration-500";
                label.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 transition animate-pulse";
                label.innerText = "Digital PIN 11: HIGH (ON)";
                
                // Button highlights
                btnOn.className = "flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/50 text-amber-800 shadow-md transition-all duration-200";
                btnOff.className = "flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-200 text-slate-500 transition-all duration-200";
                iconOn.className = "w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-lg mb-2 scale-110 shadow-inner";
                iconOff.className = "w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-lg mb-2";
            } else {
                // Off visual
                shadow.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full transition-all duration-500 blur-xl bg-transparent";
                bulb.className = "w-16 h-16 rounded-full flex items-center justify-center relative border border-slate-700 bg-slate-800 text-slate-600 transition-all duration-500";
                label.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-500 transition";
                label.innerText = "Digital PIN 11: LOW (OFF)";
                
                // Button highlights
                btnOn.className = "flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-200 text-slate-500 transition-all duration-200";
                btnOff.className = "flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-indigo-400 bg-indigo-50/40 text-indigo-800 shadow-md transition-all duration-200";
                iconOn.className = "w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-lg mb-2";
                iconOff.className = "w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg mb-2 scale-110 shadow-inner";
            }
        }
    </script>
</body>
</html>`;
  };

  const handleDownload = () => {
    const htmlContent = generateSingleHtmlFile();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div id="github-deployment" className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
            깃허브 배포 전용 Single-File 다운로드
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            HTML, CSS, JavaScript가 완전히 합쳐진 단 한 장의 파일로 간편 저장하세요!
          </p>
        </div>
      </div>

      <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed mb-6 space-y-2">
        <p className="font-semibold text-indigo-400 flex items-center gap-1">
          <Github className="w-3.5 h-3.5 inline" /> 깃허브 페이지(GitHub Pages) 배포 가이드:
        </p>
        <ol className="list-decimal pl-4 space-y-1 text-slate-400">
          <li>아래 <strong>[배포용 index.html 파일 다운로드]</strong> 버튼을 클릭하여 소스 파일을 다운받습니다.</li>
          <li>나만의 GitHub 레포지토리(Repository)에 다운받은 <code>index.html</code> 파일을 그대로 드래그 업로드합니다.</li>
          <li>레포지토리의 <em className="text-slate-200">Settings - Pages</em> 탭으로 이동합니다.</li>
          <li>Source 메뉴에서 <strong>Deploy from a branch</strong>를 선택하고, <em className="text-slate-200">main</em> 브랜치를 설정 후 저장합니다.</li>
          <li>잠시 후 전 세계 어디서나 스마트폰이나 PC로 아두이노를 제어 가능한 고유 주소(https)가 활성화됩니다!</li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>로컬 빵판/ESP 설정 IP 주소({wifiConfig.ipAddress})가 미리 주입되어 내려받아집니다.</span>
        </div>

        <button
          onClick={handleDownload}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition shadow-sm ${
            downloadSuccess
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {downloadSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 animate-bounce" />
              <span>다운로드 성공!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>배포용 index.html 파일 다운로드</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
