import { CheckCircle, AlertTriangle, Cable, ArrowRight, Zap } from 'lucide-react';

export default function WiringGuide() {
  const pinConnections = [
    { espPin: 'VCC', ardPin: '3.3V 외부 전원 (+)', desc: 'ESP-01은 부팅/통신 시 최대 200~300mA의 전류를 필요로 하므로 우노의 3.3V 핀 대신 꼭 외부 3.3V 레귤레이터나 전용 파워 서플라이 모듈을 사용할 것을 적극 권장합니다.' },
    { espPin: 'GND', ardPin: 'GND (공통 그라운드)', desc: '중요! 아두이노의 GND 핀과 외부 전원공급장치의 GND 핀은 필수적으로 함께 묶어(Common Ground) 회로를 완성해주어야 합니다.' },
    { espPin: 'TX (송신)', ardPin: 'D2 / Pin 2 (우노 RX)', desc: 'ESP-01이 보내는 시리얼 정보를 우노 소프트웨어 시리얼 RX 수신 핀으로 연결합니다.' },
    { espPin: 'RX (수신)', ardPin: 'D3 / Pin 3 (우노 TX)', desc: '우노가 보내는 명령어를 ESP-01이 수신합니다. 우노는 5V 로직 레벨을 사용하고 ESP-01은 3.3V 로직 레벨을 사용하므로, 우노 Pin 3과 ESP RX 사이에 전압 분배 저항(1kΩ & 2kΩ)이나 레벨 시프터를 거쳐서 연결하면 기기가 망가지는 것을 예방할 수 디자인적 설계입니다.' },
    { espPin: 'CH_PD / EN', ardPin: '3.3V 외부 전원 (+)', desc: '칩 활성화 핀입니다. 작동을 위해 항상 3.3V 전원에 풀업(Pull-up) 혹은 High 연결해주어야 정상 가동합니다.' },
    { espPin: 'GPIO 2', ardPin: 'N/C (단독 모드 시 LED/릴레이 연결)', desc: 'ESP-01 단독 구동형 스케치 사용 시에는 아두이노 우노를 쓰지 않고 GPIO 2에 릴레이 모듈의 신호선을 직접 직결하여 작동시킬 수 있습니다.' },
    { espPin: 'GPIO 0', ardPin: 'N/C (업로드 시 GND 연결)', desc: 'ESP-01에 펌웨어를 올릴 때만 GND에 임시 쇼트하여 프로그래밍 모드로 가입하며, 일반 가동시에는 아무것도 꽂지 않습니다.' },
  ];

  return (
    <div id="wiring-guide" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Cable className="w-5 h-5 text-indigo-500" />
          ESP-01 ↔ 아두이노 기본 배선 가이드
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">ESP-01은 무선 통신 모듈로서 전원 공급과 로직 레벨 변환에 세심한 주의가 요구됩니다.</p>
      </div>

      {/* Grid warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-amber-50 text-amber-900 border border-amber-100 rounded-xl flex gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sm font-semibold mb-1 text-amber-950">주의: 3.3V 독단 공급 필수</strong>
            아두이노 우노 보드의 3.3V 출력 핀은 통상 150mA 이내만 지원하는 경우가 많아 ESP-01의 무선 모듈을 안정 구동하기 힘듭니다. ESP-01이 주기적으로 무한 재부팅되거나 정상 동작하지 않는다면, 건전지나 USB 외부 3.3V 정전압 공급 회로(예: MB102 빵판 파워 등)를 별도로 물리셔야 작동합니다.
          </div>
        </div>

        <div className="p-4 bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-xl flex gap-3 text-xs leading-relaxed">
          <Zap className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sm font-semibold mb-1 text-indigo-950">주의: 공통 그라운드(GND) 형성</strong>
            외부 전원 공급 장치를 별도로 사용하더라도, <strong>아두이노의 GND 핀</strong>과 <strong>외부 전원 어댑터의 GND 핀</strong>, 그리고 <strong>ESP-01의 GND 핀</strong>은 반드시 전선으로 연결해 서로 전위 기준점(그라운드)을 공통 공유할 수 있도록 해야 신호 왜곡이 생기지 않습니다.
          </div>
        </div>
      </div>

      {/* Connection Table */}
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="p-3.5 pl-4 md:pl-6 w-[120px]">ESP-01 핀</th>
                <th className="p-3.5 w-[180px]">아두이노 우노 배선</th>
                <th className="p-3.5 hidden md:table-cell">상세 동작 가이드 및 설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pinConnections.map((conn, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition">
                  <td className="p-3.5 pl-4 md:pl-6 font-mono font-bold text-indigo-600">
                    {conn.espPin}
                  </td>
                  <td className="p-3.5 font-medium text-slate-900">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-250 font-mono text-xs">
                        {conn.ardPin}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 hidden md:table-cell text-xs text-slate-500 leading-normal">
                    {conn.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step by Step Diagram Text */}
      <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">회로 배선 흐름 요약</h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-lg border border-slate-100 shadow-2xs w-full justify-center">
            <span>아두이노 11번 핀</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-amber-600">저항 (220~330Ω)</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-amber-500">LED (+) 다리</span>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-lg border border-slate-100 shadow-2xs w-full justify-center">
            <span>외부 3.3V 파워</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-indigo-600">ESP-01 VCC & EN</span>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-lg border border-slate-100 shadow-2xs w-full justify-center">
            <span>공통 연결</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-emerald-600">아두이노 GND & ESP-01 GND</span>
          </div>
        </div>
      </div>
    </div>
  );
}
