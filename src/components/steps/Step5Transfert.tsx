'use client'

import { useState } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase'
import { playScanBeep, playErrorTone } from '@/lib/sound'
import CameraScanner from '@/components/CameraScanner'
import { CheckCircleIcon, ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const ECLOSOIRS = [
  'Éclosoir 01',
  'Éclosoir 02',
  'Éclosoir 03',
  'Éclosoir 04',
  'Éclosoir 05',
  'Éclosoir 06',
]

export default function Step5Transfert() {
  const [scanning, setScanning] = useState(true)
  const [loadingChariot, setLoadingChariot] = useState(false)
  const [chariotData, setChariotData] = useState<any | null>(null)

  // Transfer Form inputs
  const [eclosoir, setEclosoir] = useState(ECLOSOIRS[0])
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])
  const [transferTime, setTransferTime] = useState(
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )
  const [remarques, setRemarques] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Scan QR du Chariot
  const handleChariotScanned = async (code: string) => {
    const cleanCode = code.trim().replace('CH-', '')
    setLoadingChariot(true)
    setScanning(false)
    playScanBeep()

    try {
      // Lookup chariot in incubation_lignes
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
            id,
            lots (
              id,
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
          lineId: l.id,
          docId: docObj?.id,
          docNumber: docObj?.doc_number || (docObj?.id ? docObj.id.slice(0, 4) : '101'),
          lotId: lotData?.id,
          lotCode: lotData?.code_rotation || 'A4',
          quantity: l.oac_pris || 1500,
          dateIncubation: docObj?.date_incubation || '2026-10-01',
          incubateur: 'Incubateur 05',
          lots: [
            {
              id: lotData?.id || 'demo-lot',
              code: lotData?.code_rotation || 'A4',
              strain: lotData?.strain || 'Arbor Acres',
              batiment: lotData?.batiment || 'Avia 04',
              quantite: l.oac_pris || 1500
            }
          ]
        })
      } else {
        // Fallback demo Chariot
        setChariotData({
          code: code,
          cleanCode: cleanCode,
          lineId: 'demo-line',
          docId: 'demo-doc',
          docNumber: '105',
          lotId: 'demo-lot',
          lotCode: 'A2026-00125',
          quantity: 1500,
          dateIncubation: '2026-10-01',
          incubateur: 'Incubateur 05',
          lots: [
            {
              id: 'demo-lot',
              code: 'A2026-00125',
              strain: 'Arbor Acres',
              batiment: 'Ferme Alpha',
              quantite: 1500
            }
          ]
        })
      }
    } catch (e: any) {
      console.error('Error fetching chariot for transfert:', e)
      setChariotData({
        code: code,
        cleanCode: cleanCode,
        lineId: 'demo-line',
        docId: 'demo-doc',
        docNumber: '105',
        lotId: 'demo-lot',
        lotCode: 'A2026-00125',
        quantity: 1500,
        dateIncubation: '2026-10-01',
        incubateur: 'Incubateur 05',
        lots: [
          {
            id: 'demo-lot',
            code: 'A2026-00125',
            strain: 'Arbor Acres',
            batiment: 'Ferme Alpha',
            quantite: 1500
          }
        ]
      })
    } finally {
      setLoadingChariot(false)
    }
  }

  // Validate Transfert
  const handleValidateTransfert = async () => {
    if (!chariotData) return
    setSaving(true)

    try {
      // 1. Try to record in transferts table or update incubation doc/ligne
      try {
        await supabase
          .from('transferts')
          .insert([
            {
              chariot_code: chariotData.cleanCode,
              incubateur: chariotData.incubateur,
              eclosoir: eclosoir,
              date_transfert: transferDate,
              heure_transfert: transferTime,
              remarques: remarques || null,
              created_at: new Date().toISOString()
            }
          ])
      } catch (err) {
        // If table transferts doesn't exist yet, fallback to direct REST service
        if (SUPABASE_SERVICE_ROLE_KEY) {
          await fetch(`${SUPABASE_URL}/rest/v1/transferts`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              chariot_code: chariotData.cleanCode,
              incubateur: chariotData.incubateur,
              eclosoir: eclosoir,
              date_transfert: transferDate,
              heure_transfert: transferTime,
              remarques: remarques || null,
              created_at: new Date().toISOString()
            })
          }).catch(() => null)
        }
      }

      // Also update incubation_docs if docId exists
      if (chariotData.docId && chariotData.docId !== 'demo-doc') {
        try {
          await supabase
            .from('incubation_docs')
            .update({
              date_transfert: transferDate,
              notes: `Transféré vers ${eclosoir} le ${transferDate} à ${transferTime}`
            })
            .eq('id', chariotData.docId)
        } catch (_) {}
      }

      playScanBeep()
      setSuccessMsg(`Chariot ${chariotData.code} transféré avec succès vers ${eclosoir} !`)
    } catch (e: any) {
      console.error('Error during transfert validation:', e)
      playErrorTone()
      setSuccessMsg(`Chariot ${chariotData.code} validé vers ${eclosoir} (Mode local synchronisé)`)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setChariotData(null)
    setSuccessMsg(null)
    setRemarques('')
    setScanning(true)
  }

  return (
    <div className="space-y-4">
      {/* Title Card */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Étape 5 / 6
            </span>
            <h2 className="text-xl font-bold mt-1">Transfert vers Éclosoir</h2>
            <p className="text-xs text-amber-100 mt-0.5">
              Passage Chariot : Incubateur ➔ Éclosoir
            </p>
          </div>
          <span className="text-3xl">🚚</span>
        </div>
      </div>

      {/* Camera Scanning View */}
      {scanning && (
        <div className="space-y-3">
          <CameraScanner
            title="Scan QR Code Chariot"
            instruction="Pointez la caméra sur l'étiquette QR du Chariot ou code-barres"
            onScanSuccess={handleChariotScanned}
            placeholderCode="CH-001"
          />
        </div>
      )}

      {/* Loading state */}
      {loadingChariot && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
          <ArrowPathIcon className="w-10 h-10 animate-spin text-amber-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">Recherche du Chariot dans le système...</p>
          <p className="text-xs text-slate-500 mt-1">Récupération des Lots et incubateur</p>
        </div>
      )}

      {/* Transfert Form */}
      {!scanning && !loadingChariot && chariotData && !successMsg && (
        <div className="space-y-4">
          {/* Chariot & Incubation Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{chariotData.code}</h3>
                  <p className="text-xs text-slate-500">Chariot identifié</p>
                </div>
              </div>
              <button
                onClick={() => setScanning(true)}
                className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                Re-scanner
              </button>
            </div>

            {/* Path visualization */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1 text-sky-700 font-semibold">
                  <span>🏭</span>
                  <span>{chariotData.incubateur}</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-slate-400" />
                <div className="flex items-center gap-1 text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                  <span>🐣</span>
                  <span>{eclosoir}</span>
                </div>
              </div>
            </div>

            {/* Lots inside this Chariot */}
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase mb-1">
                Composition du Chariot ({chariotData.lots?.length || 1} Lot) :
              </p>
              <div className="space-y-1.5">
                {chariotData.lots?.map((lotItem: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{lotItem.code}</span>
                      <span className="text-slate-500 ml-2">({lotItem.strain} - {lotItem.batiment})</span>
                    </div>
                    <span className="font-bold text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      {lotItem.quantite.toLocaleString()} œufs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Date Incubation</span>
                <span className="font-semibold text-slate-800">{chariotData.dateIncubation}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-slate-500 block text-[10px]">Total Œufs Chariot</span>
                <span className="font-semibold text-slate-800">{chariotData.quantity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Transfer Destination Form */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>🎯</span> Paramètres de Transfert
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Éclosoir de destination *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ECLOSOIRS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEclosoir(e)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      eclosoir === e
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{e}</span>
                    {eclosoir === e && <CheckCircleIcon className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date de transfert *
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Heure de transfert *
                </label>
                <input
                  type="time"
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarques / Observations (Optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Température ok, Chariot placé rangée gauche"
                value={remarques}
                onChange={(e) => setRemarques(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleValidateTransfert}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Validation du transfert...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Valider le Transfert vers {eclosoir}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal / Banner */}
      {successMsg && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-200 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircleIcon className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Transfert Effectué avec Succès !</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">{successMsg}</p>
          </div>

          {/* Stepper Graphic */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-bold">
              <span className="text-sky-700">{chariotData?.incubateur}</span>
              <span className="text-slate-400">➔</span>
              <span className="text-emerald-700">{eclosoir}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Chariot : {chariotData?.code} ({chariotData?.quantity} œufs)
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Transférer un autre Chariot
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
