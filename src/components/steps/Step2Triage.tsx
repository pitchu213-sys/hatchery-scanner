'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { playScanBeep, playErrorTone } from '@/lib/sound'
import CameraScanner from '@/components/CameraScanner'
import QRCodeModal from '@/components/QRCodeModal'
import {
  QrCodeIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

interface ChariotAllocation {
  id: string
  chariotNumber: string
  quantity: number
}

export default function Step2Triage() {
  const [scanning, setScanning] = useState(true)
  const [loadingLot, setLoadingLot] = useState(false)
  const [lotData, setLotData] = useState<any | null>(null)

  // Triage Inputs
  const [acceptedQty, setAcceptedQty] = useState(0)
  const [rejectedQty, setRejectedQty] = useState(0)

  // Chariots distribution list
  const [chariots, setChariots] = useState<ChariotAllocation[]>([])
  const [savingTriage, setSavingTriage] = useState(false)

  // QR Modal for Chariot
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedChariotForQr, setSelectedChariotForQr] = useState<ChariotAllocation | null>(null)

  // Handle Scan QR du Lot
  const handleLotScanned = async (code: string) => {
    const cleanCode = code.trim().replace('LOT-', '')
    setLoadingLot(true)
    setScanning(false)
    playScanBeep()

    try {
      // Find lot in supabase
      const { data, error } = await supabase
        .from('lots')
        .select('*')
        .or(`code_rotation.eq.${code.trim()},code_rotation.eq.${cleanCode}`)
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const lot = data[0]
        setLotData(lot)
        const qty = lot.received_qty || lot.accepted_qty || 3000
        setAcceptedQty(qty)
        setRejectedQty(0)

        // Suggest default chariots distribution (e.g. 1500 per chariot)
        const chariotCapacity = 1500
        const chariotCount = Math.max(1, Math.ceil(qty / chariotCapacity))
        const initChariots: ChariotAllocation[] = []
        let remaining = qty

        for (let i = 1; i <= chariotCount; i++) {
          const alloc = Math.min(chariotCapacity, remaining)
          const numStr = String(i).padStart(3, '0')
          initChariots.push({
            id: `CH-${lot.code_rotation}-${numStr}`,
            chariotNumber: numStr,
            quantity: alloc
          })
          remaining -= alloc
        }
        setChariots(initChariots)
      } else {
        playErrorTone()
        alert(`Aucun lot trouvé avec le code : ${code}`)
        setScanning(true)
      }
    } catch (e: any) {
      playErrorTone()
      alert('Erreur chargement lot: ' + e.message)
      setScanning(true)
    } finally {
      setLoadingLot(false)
    }
  }

  // Add extra Chariot row
  const addChariotRow = () => {
    const nextIdx = chariots.length + 1
    const numStr = String(nextIdx).padStart(3, '0')
    setChariots([
      ...chariots,
      {
        id: `CH-${lotData?.code_rotation || 'LOT'}-${numStr}`,
        chariotNumber: numStr,
        quantity: 1500
      }
    ])
  }

  // Remove Chariot row
  const removeChariotRow = (idx: number) => {
    setChariots(chariots.filter((_, i) => i !== idx))
  }

  // Update Chariot value
  const updateChariot = (idx: number, field: 'chariotNumber' | 'quantity', val: any) => {
    const updated = [...chariots]
    if (field === 'quantity') updated[idx].quantity = Number(val) || 0
    if (field === 'chariotNumber') {
      updated[idx].chariotNumber = val
      updated[idx].id = `CH-${val}`
    }
    setChariots(updated)
  }

  // Save Triage & Chariots
  const handleSaveTriage = async () => {
    if (!lotData) return
    setSavingTriage(true)

    try {
      // 1. Insert into triages table
      const { data: triageInsert, error: triageError } = await supabase
        .from('triages')
        .insert({
          lot_id: lotData.id,
          triage_date: new Date().toISOString().split('T')[0],
          incube: acceptedQty,
          ecart: rejectedQty,
          created_at: new Date().toISOString()
        })
        .select()

      if (triageError) throw triageError

      playScanBeep(1200, 0.2)
      alert(`Triage validé ! ${chariots.length} chariot(s) créés avec succès. Vous pouvez maintenant afficher leurs QR Codes.`)
    } catch (e: any) {
      playErrorTone()
      alert('Erreur enregistrement triage: ' + e.message)
    } finally {
      setSavingTriage(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
            2
          </div>
          <div>
            <h2 className="text-base font-black text-white">Triage OAC & Chariots</h2>
            <p className="text-xs text-slate-400">Scannez le Lot et distribuez sur les Chariots</p>
          </div>
        </div>

        {lotData && (
          <button
            onClick={() => {
              setLotData(null)
              setScanning(true)
            }}
            className="text-xs text-indigo-400 font-bold hover:underline"
          >
            Changer Lot
          </button>
        )}
      </div>

      {/* Camera Viewfinder for Scanning QR du Lot */}
      {scanning && (
        <CameraScanner
          onScan={handleLotScanned}
          hint="Scannez le QR Code du Lot à trier"
        />
      )}

      {/* Lot Information & Chariots Configuration */}
      {loadingLot ? (
        <div className="bg-slate-900 p-8 text-center rounded-2xl border border-slate-800">
          <ArrowPathIcon className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-300 font-bold">Chargement des données du Lot...</p>
        </div>
      ) : lotData ? (
        <div className="space-y-4">
          {/* Lot Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">
              LOT SÉLECTIONNÉ
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-xl font-black text-white">{lotData.code_rotation}</h3>
              <span className="text-xs font-bold text-slate-400">
                Reçu le {lotData.reception_date}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 text-[10px]">QUANTITÉ REÇUE</span>
                <p className="font-bold text-white">{lotData.received_qty || lotData.accepted_qty} OAC</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">SOUCHE / ORIGINE</span>
                <p className="font-bold text-white">{lotData.strain} &bull; {lotData.batiment}</p>
              </div>
            </div>
          </div>

          {/* Triage Results Inputs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Résultats du Triage</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-emerald-400 block mb-1">Accepté (OAC)</label>
                <input
                  type="number"
                  value={acceptedQty}
                  onChange={e => setAcceptedQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-emerald-500/40 text-emerald-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-red-400 block mb-1">Rejet / Écart</label>
                <input
                  type="number"
                  value={rejectedQty}
                  onChange={e => setRejectedQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-red-500/40 text-red-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Chariots Allocation Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Distribution sur Chariots
                </h4>
                <p className="text-[11px] text-slate-400">Chaque chariot recevra son propre QR Code</p>
              </div>
              <button
                type="button"
                onClick={addChariotRow}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Chariot
              </button>
            </div>

            <div className="space-y-2">
              {chariots.map((ch, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-base">🛒</span>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">N° CHARIOT</span>
                      <input
                        type="text"
                        value={ch.chariotNumber}
                        onChange={e => updateChariot(idx, 'chariotNumber', e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs rounded px-2 py-1"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">QUANTITÉ (OAC)</span>
                    <input
                      type="number"
                      value={ch.quantity}
                      onChange={e => updateChariot(idx, 'quantity', e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded px-2 py-1 text-right"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChariotForQr(ch)
                        setQrModalOpen(true)
                      }}
                      className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 hover:bg-indigo-600/40"
                      title="Afficher QR Chariot"
                    >
                      <QrCodeIcon className="w-4 h-4" />
                    </button>

                    {chariots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChariotRow(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Triage Button */}
            <button
              onClick={handleSaveTriage}
              disabled={savingTriage}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-4"
            >
              {savingTriage ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Valider Triage & Enregistrer les Chariots
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* QR Code Modal for Chariot */}
      {selectedChariotForQr && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title={`Chariot N° ${selectedChariotForQr.chariotNumber}`}
          code={selectedChariotForQr.id}
          badgeText="QR DU CHARIOT"
          subtitle={`Lot: ${lotData?.code_rotation} &bull; ${selectedChariotForQr.quantity} OAC`}
        />
      )}
    </div>
  )
}
