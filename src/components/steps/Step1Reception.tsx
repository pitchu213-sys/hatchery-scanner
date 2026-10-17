'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { playScanBeep, playErrorTone } from '@/lib/sound'
import QRCodeModal from '@/components/QRCodeModal'
import { CheckCircleIcon, QrCodeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function Step1Reception() {
  const [lotCode, setLotCode] = useState(`LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split('T')[0])
  const [origin, setOrigin] = useState('')
  const [strain, setStrain] = useState('Arbor Acres')
  const [ageWeeks, setAgeWeeks] = useState(32)
  const [quantity, setQuantity] = useState(15000)
  const [creating, setCreating] = useState(false)

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [createdLotCode, setCreatedLotCode] = useState('')

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lotCode.trim() || !quantity) {
      alert('Veuillez renseigner le numéro du lot et la quantité reçue.')
      return
    }

    setCreating(true)
    try {
      // Create lot via secure server route (bypasses RLS and uses exact DB columns)
      const res = await fetch('/api/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotCode: lotCode.trim(),
          receptionDate: receptionDate,
          origin: origin || 'Ferme Élevage',
          strain: strain,
          ageWeeks: Number(ageWeeks) || 32,
          quantity: Number(quantity)
        })
      })

      const result = await res.json()
      if (!res.ok || result.error) {
        throw new Error(result.error || 'Erreur lors de la création du lot')
      }

      playScanBeep(1200, 0.15)
      setCreatedLotCode(lotCode.trim())
      setQrModalOpen(true)

      // Prepare next random lot code
      setLotCode(`LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
    } catch (e: any) {
      playErrorTone()
      alert('Erreur création lot: ' + (e?.message || 'Erreur inconnue'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black">
            1
          </div>
          <div>
            <h2 className="text-base font-black text-white">Réception OAC — Création Lot</h2>
            <p className="text-xs text-slate-400">Enregistrez le lot reçu et générez son QR Code officiel</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleCreateLot} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">
            Numéro / Code du Lot <span className="text-indigo-400">*</span>
          </label>
          <input
            type="text"
            required
            value={lotCode}
            onChange={e => setLotCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Ex: 2026-00125 ou A4"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Date Réception</label>
            <input
              type="date"
              required
              value={receptionDate}
              onChange={e => setReceptionDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Quantité Reçue</label>
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: 15000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Souche</label>
            <select
              value={strain}
              onChange={e => setStrain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Arbor Acres">Arbor Acres</option>
              <option value="Ross 308">Ross 308</option>
              <option value="Cobb 500">Cobb 500</option>
              <option value="Hubbard">Hubbard</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Âge Semaines</label>
            <input
              type="number"
              min="20"
              max="70"
              value={ageWeeks}
              onChange={e => setAgeWeeks(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">Origine / Bâtiment / Fournisseur</label>
          <input
            type="text"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Ferme Oued 1 - Bâtiment 3"
          />
        </div>

        <button
          type="submit"
          disabled={creating}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all pt-3"
        >
          {creating ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <QrCodeIcon className="w-5 h-5" />
              Créer le Lot & Générer son QR Code
            </>
          )}
        </button>
      </form>

      {/* QR Code Modal for newly created lot */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`Lot ${createdLotCode}`}
        code={createdLotCode}
        badgeText="QR DU LOT"
        subtitle={`${quantity.toLocaleString('fr-FR')} OAC reçus le ${receptionDate}`}
      />
    </div>
  )
}
