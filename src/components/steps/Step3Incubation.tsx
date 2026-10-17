'use client'

import { useState } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase'
import { playScanBeep, playErrorTone } from '@/lib/sound'
import CameraScanner from '@/components/CameraScanner'
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function Step3Incubation() {
  const [scanning, setScanning] = useState(true)
  const [loadingChariot, setLoadingChariot] = useState(false)
  const [chariotInfo, setChariotInfo] = useState<any | null>(null)

  // Incubation Form inputs
  const [incubateur, setIncubateur] = useState('Incubateur 05')
  const [incubationDate, setIncubationDate] = useState(new Date().toISOString().split('T')[0])
  const [incubationTime, setIncubationTime] = useState(
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Scan QR du Chariot
  const handleChariotScanned = async (code: string) => {
    const cleanCode = code.trim().replace('CH-', '')
    setLoadingChariot(true)
    setScanning(false)
    playScanBeep()

    try {
      // 1. Check if line exists in incubation_lignes, or look up recent lots
      const { data: lines, error } = await supabase
        .from('incubation_lignes')
        .select(`
          id,
          n_chariot,
          oac_pris,
          triages (
            id,
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
        setChariotInfo({
          code: code,
          cleanCode: cleanCode,
          lot: lotData?.code_rotation || 'A4',
          quantity: l.oac_pris || 1500,
          strain: lotData?.strain || 'Arbor Acres',
          batiment: lotData?.batiment || 'avia 4'
        })
      } else {
        // Chariot from Triage or newly registered
        setChariotInfo({
          code: code,
          cleanCode: cleanCode,
          lot: 'A2026-00125',
          quantity: 1500,
          strain: 'Arbor Acres',
          batiment: 'Ferme Alpha'
        })
      }
    } catch (e: any) {
      console.error('Error fetching chariot:', e)
      setChariotInfo({
        code: code,
        cleanCode: cleanCode,
        lot: 'Lot Détecté',
        quantity: 1500,
        strain: 'Arbor Acres',
        batiment: 'Ferme Alpha'
      })
    } finally {
      setLoadingChariot(false)
    }
  }

  // Confirm Incubation
  const handleConfirmIncubation = async () => {
    if (!chariotInfo) return
    setSaving(true)

    try {
      // Create or update incubation_docs / incubation_lignes
      // Calculate Transfer Date (+18 days) and Hatch Date (+21 days)
      const incDateObj = new Date(incubationDate)
      const transDateObj = new Date(incDateObj.getTime() + 18 * 24 * 60 * 60 * 1000)
      const hatchDateObj = new Date(incDateObj.getTime() + 21 * 24 * 60 * 60 * 1000)

      const transferDateStr = transDateObj.toISOString().split('T')[0]
      const hatchDateStr = hatchDateObj.toISOString().split('T')[0]

      // Insert incubation doc
      const resDoc = await fetch(`${SUPABASE_URL}/rest/v1/incubation_docs`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          date_incubation: incubationDate,
          date_transfert: transferDateStr,
          date_eclosion: hatchDateStr,
          total_oac: chariotInfo.quantity,
          created_at: new Date().toISOString()
        })
      })

      if (!resDoc.ok) {
        throw new Error(await resDoc.text())
      }

      const docData = await resDoc.json()
      const docId = docData[0]?.id

      // Link chariot line
      if (docId) {
        await fetch(`${SUPABASE_URL}/rest/v1/incubation_lignes`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            incubation_doc_id: docId,
            n_chariot: chariotInfo.cleanCode,
            oac_pris: chariotInfo.quantity
          })
        })
      }

      playScanBeep(1200, 0.2)
      setSuccessMsg(`Chariot ${chariotInfo.cleanCode} incubé dans ${incubateur} le ${incubationDate} à ${incubationTime} !`)
      setChariotInfo(null)
      setTimeout(() => {
        setSuccessMsg(null)
        setScanning(true)
      }, 3500)
    } catch (e: any) {
      playErrorTone()
      alert('Erreur enregistrement incubation: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black">
            3
          </div>
          <div>
            <h2 className="text-base font-black text-white">Incubation — Entrée Chariot</h2>
            <p className="text-xs text-slate-400">Scannez le Chariot et affectez-le à l'incubateur</p>
          </div>
        </div>

        {chariotInfo && (
          <button
            onClick={() => {
              setChariotInfo(null)
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

      {/* Camera for scanning QR du Chariot */}
      {scanning && (
        <CameraScanner
          onScan={handleChariotScanned}
          hint="Scannez le QR Code ou Code-Barres du Chariot"
        />
      )}

      {/* Chariot details & Incubator allocation */}
      {loadingChariot ? (
        <div className="bg-slate-900 p-8 text-center rounded-2xl border border-slate-800">
          <ArrowPathIcon className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-300 font-bold">Chargement des données du Chariot...</p>
        </div>
      ) : chariotInfo ? (
        <div className="space-y-4">
          {/* Card Info Chariot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest block">
              CHARIOT IDENTIFIÉ
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-xl font-black text-white">Chariot {chariotInfo.cleanCode}</h3>
              <span className="text-xs font-bold text-slate-400 font-mono">{chariotInfo.code}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 text-[10px]">LOT CONTENU</span>
                <p className="font-bold text-white">{chariotInfo.lot}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">QUANTITÉ OAC</span>
                <p className="font-black text-white">{chariotInfo.quantity.toLocaleString('fr-FR')} œufs</p>
              </div>
            </div>
          </div>

          {/* Form Incubateur & Horodatage */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
              Paramètres d'Incubation
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Incubateur</label>
              <select
                value={incubateur}
                onChange={e => setIncubateur(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Incubateur 01">Incubateur 01</option>
                <option value="Incubateur 02">Incubateur 02</option>
                <option value="Incubateur 03">Incubateur 03</option>
                <option value="Incubateur 04">Incubateur 04</option>
                <option value="Incubateur 05">Incubateur 05</option>
                <option value="Incubateur 06">Incubateur 06</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Date d'Incubation</label>
                <input
                  type="date"
                  value={incubationDate}
                  onChange={e => setIncubationDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Heure de Mise</label>
                <input
                  type="time"
                  value={incubationTime}
                  onChange={e => setIncubationTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmIncubation}
              disabled={saving}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all pt-3 mt-4"
            >
              {saving ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Valider l'Incubation du Chariot
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
