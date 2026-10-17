'use client'

import { useState, useEffect, useRef } from 'react'
import { BoltIcon } from '@heroicons/react/24/outline'

interface CameraScannerProps {
  onScan?: (code: string) => void
  onScanSuccess?: (code: string) => void
  hint?: string
  instruction?: string
  title?: string
  placeholderCode?: string
  onManualOpen?: () => void
}

export default function CameraScanner({
  onScan,
  onScanSuccess,
  hint = 'Pointez la caméra vers le QR Code ou Code-Barres',
  instruction,
  title,
  placeholderCode = 'CH-001',
  onManualOpen
}: CameraScannerProps) {
  const effectiveOnScan = onScan || onScanSuccess || (() => {})
  const displayHint = instruction || hint
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState(placeholderCode)
  const html5QrCodeRef = useRef<any>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const lastScannedRef = useRef<string | null>(null)
  const lastScannedTimeRef = useRef<number>(0)

  useEffect(() => {
    let isMounted = true

    async function startScanner() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (!isMounted) return

        if (html5QrCodeRef.current) {
          try { await html5QrCodeRef.current.stop() } catch {}
          try { await html5QrCodeRef.current.clear() } catch {}
        }

        const scanner = new Html5Qrcode('camera-stream', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.UPC_A
          ],
          verbose: false
        })
        html5QrCodeRef.current = scanner

        const config = {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment',
            focusMode: 'continuous',
          }
        }

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText: string) => {
            const now = Date.now()
            // Throttle duplicate scans of the exact same code within 1.5s
            if (lastScannedRef.current === decodedText && now - lastScannedTimeRef.current < 1500) {
              return
            }
            lastScannedRef.current = decodedText
            lastScannedTimeRef.current = now
            effectiveOnScan(decodedText)
          },
          () => {}
        )

        // Check if flashlight torch is supported
        const video = document.querySelector('#camera-stream video') as HTMLVideoElement
        if (video && video.srcObject) {
          const stream = video.srcObject as MediaStream
          const track = stream.getVideoTracks()[0]
          if (track) {
            trackRef.current = track
            const capabilities: any = track.getCapabilities?.() || {}
            if (capabilities.torch) setTorchSupported(true)
          }
        }
      } catch (e) {
        console.warn('Error starting camera scanner:', e)
      }
    }

    startScanner()

    return () => {
      isMounted = false
      if (html5QrCodeRef.current) {
        try { html5QrCodeRef.current.stop() } catch {}
        try { html5QrCodeRef.current.clear() } catch {}
      }
    }
  }, [onScan])

  const toggleTorch = async () => {
    if (!trackRef.current) return
    try {
      const next = !torchOn
      await (trackRef.current as any).applyConstraints({
        advanced: [{ torch: next }]
      })
      setTorchOn(next)
    } catch {}
  }

  return (
    <div className="relative bg-black w-full aspect-square overflow-hidden border-b border-slate-800 flex items-center justify-center">
      {/* Video Stream Element */}
      <div id="camera-stream" className="w-full h-full object-cover" />

      {/* Viewfinder Target Rectangle Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-60 h-60 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          {/* 4 Corner Markers */}
          <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
          <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
          <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br" />

          {/* Red Laser Aiming Animation Line */}
          <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] absolute top-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto">
        {torchSupported ? (
          <button
            onClick={toggleTorch}
            className={`p-2.5 rounded-full border backdrop-blur-md transition-all ${
              torchOn
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg'
                : 'bg-slate-950/60 text-white border-slate-700 hover:bg-slate-800'
            }`}
            title="Activer/Désactiver le Flash"
          >
            <BoltIcon className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <span className="text-[11px] font-bold text-white bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 truncate max-w-[200px]">
          {displayHint}
        </span>

        {onManualOpen ? (
          <button
            onClick={onManualOpen}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/90 text-white border border-indigo-400 text-xs font-bold backdrop-blur-md hover:bg-indigo-600 active:scale-95 transition-all"
          >
            Clavier ⌨
          </button>
        ) : (
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-white border border-slate-600 text-xs font-bold backdrop-blur-md hover:bg-slate-700 active:scale-95 transition-all"
          >
            Manuel ⌨
          </button>
        )}
      </div>

      {showManualInput && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 p-4 flex flex-col justify-center items-center pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl w-full max-w-xs space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-white text-center">Saisie Manuelle ID</h4>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex: CH-001 ou LOT-..."
              className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-center p-2.5 rounded-xl text-base"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowManualInput(false)}
                className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (manualCode.trim()) {
                    effectiveOnScan(manualCode.trim())
                    setShowManualInput(false)
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold shadow"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
