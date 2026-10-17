'use client'

import { useState, useEffect } from 'react'
import { playScanBeep, playErrorTone } from '@/lib/sound'
import QRCodeModal from '@/components/QRCodeModal'
import {
  CheckCircleIcon,
  QrCodeIcon,
  ArrowPathIcon,
  TruckIcon,
  UserIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

interface RotationRef {
  id: string
  code: string
  batiment?: string
  date_entree?: string
  souche?: string
  f_depart?: string
}

interface TransporteurRef {
  id: string
  code: string
  nom_prenom: string
}

interface ResponsableRef {
  id: string
  nom: string
}

export default function Step1Reception() {
  // References from Hatchery App
  const [rotations, setRotations] = useState<RotationRef[]>([])
  const [transporteurs, setTransporteurs] = useState<TransporteurRef[]>([])
  const [responsables, setResponsables] = useState<ResponsableRef[]>([])
  const [loadingRefs, setLoadingRefs] = useState(true)

  // Selected & Computed Fields
  const [selectedRotationCode, setSelectedRotationCode] = useState<string>('')
  const [receptionDate, setReceptionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [bonReceptionNo, setBonReceptionNo] = useState<string>(
    `BR-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`
  )
  const [strain, setStrain] = useState<string>('')
  const [batiment, setBatiment] = useState<string>('')
  const [farmName, setFarmName] = useState<string>('')
  const [dateEntree, setDateEntree] = useState<string>('')
  const [ageWeeks, setAgeWeeks] = useState<number>(32)

  // Chauffeur & Responsable (اسم السائق و اسم القابل)
  const [chauffeurNom, setChauffeurNom] = useState<string>('')
  const [transporteurCode, setTransporteurCode] = useState<string>('')
  const [responsableNom, setResponsableNom] = useState<string>('')

  // Quantity
  const [quantity, setQuantity] = useState<number>(15000)
  const [creating, setCreating] = useState<boolean>(false)

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false)
  const [createdLotCode, setCreatedLotCode] = useState<string>('')
  const [createdLotSubtext, setCreatedLotSubtext] = useState<string>('')

  // 1. Fetch reference data from Hatchery App on mount
  useEffect(() => {
    async function loadRefs() {
      try {
        setLoadingRefs(true)
        const res = await fetch('/api/references')
        const data = await res.json()

        if (data.rotations && data.rotations.length > 0) {
          setRotations(data.rotations)
          // Default to first rotation
          applyRotation(data.rotations[0], receptionDate)
        }

        if (data.transporteurs && data.transporteurs.length > 0) {
          setTransporteurs(data.transporteurs)
          setChauffeurNom(data.transporteurs[0].nom_prenom)
          setTransporteurCode(data.transporteurs[0].code)
        }

        if (data.responsables && data.responsables.length > 0) {
          setResponsables(data.responsables)
          setResponsableNom(data.responsables[0].nom)
        }
      } catch (err) {
        console.error('Failed to load references:', err)
      } finally {
        setLoadingRefs(false)
      }
    }
    loadRefs()
  }, [])

  // Helper to apply rotation and recalculate age
  const applyRotation = (rot: RotationRef, recDate: string) => {
    setSelectedRotationCode(rot.code)
    setStrain(rot.souche || 'Arbor')
    setBatiment(rot.batiment || '')
    setFarmName(rot.f_depart || '')
    setDateEntree(rot.date_entree || '')

    // Auto-calculate age in weeks
    if (rot.date_entree && recDate) {
      const d1 = new Date(rot.date_entree)
      const d2 = new Date(recDate)
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
        const weeks = Math.max(1, Math.floor(diffDays / 7))
        setAgeWeeks(weeks)
      }
    }
  }

  // Handle Rotation change
  const handleRotationChange = (code: string) => {
    const rot = rotations.find((r) => r.code === code)
    if (rot) {
      applyRotation(rot, receptionDate)
    }
  }

  // Handle Reception Date change (recalculate age)
  const handleDateChange = (newDate: string) => {
    setReceptionDate(newDate)
    if (dateEntree && newDate) {
      const d1 = new Date(dateEntree)
      const d2 = new Date(newDate)
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
        const weeks = Math.max(1, Math.floor(diffDays / 7))
        setAgeWeeks(weeks)
      }
    }
  }

  // Handle Chauffeur select
  const handleChauffeurChange = (chName: string) => {
    setChauffeurNom(chName)
    const t = transporteurs.find((item) => item.nom_prenom === chName)
    if (t) setTransporteurCode(t.code)
  }

  // Handle Create Lot Submit
  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRotationCode || !quantity) {
      alert('Veuillez sélectionner un Lot (Rotation) et indiquer la quantité reçue.')
      return
    }

    setCreating(true)

    try {
      const res = await fetch('/api/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_rotation: selectedRotationCode,
          bon_reception_no: bonReceptionNo.trim(),
          reception_date: receptionDate,
          flock_age_weeks: ageWeeks,
          strain: strain,
          batiment: batiment,
          farm_name: farmName,
          date_entree: dateEntree,
          chauffeur_nom: chauffeurNom,
          transporteur: transporteurCode,
          responsable: responsableNom,
          quantity: Number(quantity),
        }),
      })

      const result = await res.json()
      if (!res.ok || result.error) {
        throw new Error(result.error || 'Erreur lors de la création du lot')
      }

      playScanBeep(1200, 0.2)
      const officialLotCode = `LOT-${selectedRotationCode}`
      setCreatedLotCode(officialLotCode)
      setCreatedLotSubtext(
        `Lot ${selectedRotationCode} (${strain}) — ${quantity.toLocaleString('fr-FR')} OAC • ${bonReceptionNo}`
      )
      setQrModalOpen(true)

      // Renew Bon Réception number for next batch
      setBonReceptionNo(
        `BR-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`
      )
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
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-black text-lg border border-white/20">
              1
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                Synchronisé Hatchery App
              </span>
              <h2 className="text-base font-bold mt-0.5">Réception OAC — Création Lot</h2>
              <p className="text-[11px] text-blue-100">
                Lots, Souches, Chauffeurs et Responsables liés en direct
              </p>
            </div>
          </div>
          <span className="text-3xl">🥚</span>
        </div>
      </div>

      {/* Loading state for references */}
      {loadingRefs && (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-sm">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">
            Chargement des Lots et Données depuis Hatchery App...
          </p>
        </div>
      )}

      {/* Main Reception Form */}
      {!loadingRefs && (
        <form
          onSubmit={handleCreateLot}
          className="bg-white rounded-2xl p-4 space-y-3.5 shadow-sm border border-slate-200"
        >
          {/* 1. SELECTION DU LOT (ROATATION ISSUE DE HATCHERY APP) */}
          <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
            <label className="text-xs font-bold text-indigo-950 flex items-center justify-between mb-1">
              <span>Nom du Lot (Rotation) *</span>
              <span className="text-[10px] bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-md font-mono">
                {rotations.length} Lots trouvés
              </span>
            </label>
            <select
              required
              value={selectedRotationCode}
              onChange={(e) => handleRotationChange(e.target.value)}
              className="w-full bg-white border border-indigo-300 text-slate-900 font-extrabold text-base rounded-xl px-3 py-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {rotations.map((r) => (
                <option key={r.id || r.code} value={r.code}>
                  Lot {r.code} — {r.souche || 'Souche standard'} ({r.batiment || 'Bâtiment'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. INFOS AUTO-REMPLIES : SOUCHE & ÂGE REPRODUCTRICES */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Souche (Auto) */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Souche (Auto)
              </span>
              <span className="text-sm font-black text-slate-900 block truncate">
                {strain || 'Non définie'}
              </span>
              <span className="text-[10px] text-slate-400">
                {batiment ? `${batiment}` : 'Bâtiment'}
              </span>
            </div>

            {/* Âge en semaines (Auto-calculé) */}
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                Âge des mères (Auto)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-emerald-700">{ageWeeks}</span>
                <span className="text-xs font-semibold text-emerald-800">semaines</span>
              </div>
              <span className="text-[10px] text-emerald-600">Calculé / date d&apos;entrée</span>
            </div>
          </div>

          {/* 3. N° BON RECEPTION & DATE RECEPTION */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                N° Bon Réception *
              </label>
              <input
                type="text"
                required
                value={bonReceptionNo}
                onChange={(e) => setBonReceptionNo(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: 3301-260101"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Date Réception *
              </label>
              <input
                type="date"
                required
                value={receptionDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 4. QUANTITÉ REÇUE (OAC) */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Quantité Reçue (Œufs OAC) *
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full text-base font-black bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: 15000"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                œufs
              </span>
            </div>
          </div>

          {/* 5. CHAUFFEUR (اسم السائق) & RESPONSABLE / RÉCEPTIONNAIRE (اسم القابل) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
            {/* Chauffeur */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <TruckIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nom Chauffeur *</span>
              </label>
              <select
                value={chauffeurNom}
                onChange={(e) => handleChauffeurChange(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              >
                {transporteurs.map((t) => (
                  <option key={t.id || t.code} value={t.nom_prenom}>
                    {t.nom_prenom} (Code {t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Responsable / Réceptionnaire (اسم القابل) */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Responsable (القابل) *</span>
              </label>
              <select
                value={responsableNom}
                onChange={(e) => setResponsableNom(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              >
                {responsables.map((resp) => (
                  <option key={resp.id || resp.nom} value={resp.nom}>
                    {resp.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={creating}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-2"
          >
            {creating ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>Enregistrement dans Hatchery App...</span>
              </>
            ) : (
              <>
                <QrCodeIcon className="w-5 h-5" />
                <span>Créer Lot & Générer QR Code</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* QR Code Modal for newly created lot */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`Lot ${createdLotCode}`}
        code={createdLotCode}
        badgeText="QR DU LOT ENREGISTRÉ"
        subtitle={createdLotSubtext}
      />
    </div>
  )
}
