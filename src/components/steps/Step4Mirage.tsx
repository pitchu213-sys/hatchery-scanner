'use client'

import { useState } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase'
import { playScanBeep, playErrorTone } from '@/lib/sound'
import CameraScanner from '@/components/CameraScanner'
import { CheckCircleIcon, ArrowPathIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

const DEFAULT_PLATEAUX = [
  { plateau: 'P3', nbre_clairs: 6 },
  { plateau: 'P9', nbre_clairs: 7 },
  { plateau: 'P14', nbre_clairs: 5 },
  { plateau: 'P19', nbre_clairs: 8 },
  { plateau: 'P25', nbre_clairs: 6 },
  { plateau: 'P30', nbre_clairs: 6 },
]

export default function Step4Mirage() {
  const [scanning, setScanning] = useState(true)
  const [loadingChariot, setLoadingChariot] = useState(false)
  const [chariotData, setChariotData] = useState<any | null>(null)
  const [plateaux, setPlateaux] = useState(DEFAULT_PLATEAUX)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Scan QR du Chariot
  const handleChariotScanned = async (code: string) => {
    const cleanCode = code.trim().replace('CH-', '')
    setLoadingChariot(true)
    setScanning(false)
    playScanBeep()

    try {
      const { data: lines, error } = await supabase
        .from('incubation_lignes')
        .select(`
          id,
          n_chariot,
          oac_pris,
          incubation_docs (
            id,
            doc_number,
            date_incubation,
            date_transfert
          ),
          triages (
            lots (
              code_rotation,
              strain,
              batiment
            )
          )
        `)
        .eq('n_chariot', cleanCode)
        .order('created_at', { ascending: false })
        .limit(1)

      if (lines && lines.length > 0) {
        const l: any = lines[0]
        const lotObj = Array.isArray(l.triages) ? l.triages[0]?.lots : l.triages?.lots
        const lotData = Array.isArray(lotObj) ? lotObj[0] : lotObj
        const docObj = Array.isArray(l.incubation_docs) ? l.incubation_docs[0] : l.incubation_docs
        setChariotData({
          code: code,
          cleanCode: cleanCode,
          docId: docObj?.id,
          docNumber: docObj?.doc_number || (docObj?.id ? docObj.id.slice(0, 4) : '-'),
          lot: lotData?.code_rotation || 'A4',
          quantity: l.oac_pris || 1500,
          dateIncubation: docObj?.date_incubation || '2026-10-01',
          dateTransfert: docObj?.date_transfert || '2026-10-19',
          incubateur: 'Incubateur 05'
        })
      } else {
        // Fallback demo chariot
        setChariotData({
          code: code,
          cleanCode: cleanCode,
          docId: 'demo',
          docNumber: '105',
          lot: 'A2026-00125',
          quantity: 1500,
          dateIncubation: '2026-10-01',
          dateTransfert: '2026-10-19',
          incubateur: 'Incubateur 05'
        })
      }
      setPlateaux(DEFAULT_PLATEAUX.map(p => ({ ...p })))
    } catch (e: any) {
      console.error('Error fetching chariot for mirage:', e)
    } finally {
      setLoadingChariot(false)
    }
  }

  const updatePlateau = (idx: number, delta: number) => {
    setPlateaux(prev => {
      const updated = [...prev]
      const curr = updated[idx].nbre_clairs
      updated[idx].nbre_clairs = Math.max(0, Math.min(150, curr + delta))
      return updated
    })
  }

  // Live calculations
  const sumSample = plateaux.reduce((s, p) => s + p.nbre_clairs, 0)
  const totalClairs = Math.round(sumSample * (16 / 3))
  const oacTotal = chariotData?.quantity || 1500
  const tauxClairs = oacTotal > 0 ? (totalClairs / oacTotal) * 100 : 0
  const fertilite = Math.max(0, 100 - tauxClairs)
  const poussinsPrevu = Math.round(oacTotal * ((fertilite * 0.90) / 100))

  // Save Mirage
  const handleSaveMirage = async () => {
    if (!chariotData) return
    setSaving(true)

    try {
      const lignesToInsert = plateaux.map(p => ({
        n_chariot: chariotData.cleanCode,
        plateau: p.plateau,
        date_reception: new Date().toISOString().split('T')[0],
        nbre_clairs: p.nbre_clairs,
        taux_clairs: (p.nbre_clairs / 150) * 100
      }))

      if (chariotData.docId && chariotData.docId !== 'demo') {
        await fetch(`${SUPABASE_URL}/rest/v1/mirage_lignes?on_conflict=mirage_doc_id,n_chariot,plateau`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(lignesToInsert.map(l => ({ ...l, mirage_doc_id: chariotData.docId })))
        })
      }

      playScanBeep(1200, 0.2)
      setSuccessMsg(`Mirage du Chariot ${chariotData.cleanCode} enregistré avec succès (${fertilite.toFixed(1)}% Fertilité) !`)
      setChariotData(null)
      setTimeout(() => {
        setSuccessMsg(null)
        setScanning(true)
      }, 3500)
    } catch (e: any) {
      playErrorTone()
      alert('Erreur enregistrement mirage: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
            4
          </div>
          <div>
            <h2 className="text-base font-black text-white">Mirage OAC — Saisie Clairs</h2>
            <p className="text-xs text-slate-400">Scannez le Chariot au mirage sans ressaisie</p>
          </div>
        </div>

        {chariotData && (
          <button
            onClick={() => {
              setChariotData(null)
              setScanning(true)
            }}
            className="text-xs text-indigo-400 font-bold hover:underline"
          >
            Changer
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-950 border border-emerald-500/60 text-emerald-200 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Camera */}
      {scanning && (
        <CameraScanner
          onScan={handleChariotScanned}
          hint="Scannez le QR Code du Chariot à mirer"
        />
      )}

      {loadingChariot ? (
        <div className="bg-slate-900 p-8 text-center rounded-2xl border border-slate-800">
          <ArrowPathIcon className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-300 font-bold">Recherche automatique des données du Chariot...</p>
        </div>
      ) : chariotData ? (
        <div className="space-y-4">
          {/* Automatic Chariot Context Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">
              DONNÉES RECONNUES DU CHARIOT
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-xl font-black text-white">Chariot {chariotData.cleanCode}</h3>
              <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-600/40">
                {chariotData.incubateur}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 text-[10px]">LOT CONTENU</span>
                <p className="font-bold text-white">{chariotData.lot}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">QUANTITÉ TOTALE</span>
                <p className="font-bold text-white">{chariotData.quantity.toLocaleString('fr-FR')} OAC</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">DATE INCUBATION</span>
                <p className="font-bold text-slate-300">{chariotData.dateIncubation}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">DATE TRANSFERT</span>
                <p className="font-bold text-amber-300">{chariotData.dateTransfert}</p>
              </div>
            </div>
          </div>

          {/* Live KPI Strip */}
          <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
            <div>
              <span className="text-[9px] font-bold text-slate-400 block">ÉCHANT.</span>
              <span className="text-xs font-black text-white">{sumSample} / 900</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block">CLAIRS</span>
              <span className="text-xs font-black text-amber-400">{totalClairs}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block">% FERT.</span>
              <span className="text-xs font-black text-emerald-400">{fertilite.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block">POUSSINS</span>
              <span className="text-xs font-black text-indigo-400">{poussinsPrevu.toLocaleString('fr-FR')}</span>
            </div>
          </div>

          {/* 6 Plateaux Steppers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block mb-1">
              Sondage des 6 plateaux (150 œufs / plateau) :
            </span>

            {plateaux.map((p, idx) => {
              const taux = ((p.nbre_clairs / 150) * 100).toFixed(1)
              return (
                <div
                  key={p.plateau}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2.5 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-xs font-black text-white flex items-center justify-center">
                      {p.plateau}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{taux}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updatePlateau(idx, -1)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm active:scale-95"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>

                    <span className="w-8 text-center font-black text-sm text-white">{p.nbre_clairs}</span>

                    <button
                      type="button"
                      onClick={() => updatePlateau(idx, 1)}
                      className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center text-sm active:scale-95"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}

            <button
              onClick={handleSaveMirage}
              disabled={saving}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all pt-3 mt-4"
            >
              {saving ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Valider le Mirage du Chariot
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
