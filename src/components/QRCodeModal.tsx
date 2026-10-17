'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  code: string
  subtitle?: string
  badgeText?: string
}

export default function QRCodeModal({
  isOpen,
  onClose,
  title,
  code,
  subtitle,
  badgeText
}: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (isOpen && code && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, code, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
    }
  }, [isOpen, code])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `QR_${code}.png`
      a.click()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-center">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="text-left">
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">
              {badgeText || 'IDENTIFIANT QR'}
            </span>
            <h3 className="text-base font-black text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto">
          <canvas ref={canvasRef} className="mx-auto" />
        </div>

        {/* Identifier Badge */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Code Unique</span>
          <p className="text-lg font-mono font-black text-indigo-300 tracking-wider mt-0.5">{code}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownload}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-indigo-400" />
            Télécharger
          </button>
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <PrinterIcon className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  )
}
