'use client'

import { useState } from 'react'
import Step1Reception from '@/components/steps/Step1Reception'
import Step2Triage from '@/components/steps/Step2Triage'
import Step3Incubation from '@/components/steps/Step3Incubation'
import Step4Mirage from '@/components/steps/Step4Mirage'
import Step5Transfert from '@/components/steps/Step5Transfert'
import Step6Eclosion from '@/components/steps/Step6Eclosion'
import {
  QrCodeIcon,
  SparklesIcon,
  ArrowPathIcon,
  SignalIcon,
} from '@heroicons/react/24/outline'

const STEPS = [
  { id: 1, name: 'Réception', shortName: '1. Réception', icon: '🥚', color: 'from-blue-600 to-indigo-700' },
  { id: 2, name: 'Triage', shortName: '2. Triage', icon: '⚖️', color: 'from-emerald-600 to-green-700' },
  { id: 3, name: 'Incubation', shortName: '3. Incubation', icon: '🏭', color: 'from-purple-600 to-indigo-700' },
  { id: 4, name: 'Mirage', shortName: '4. Mirage', icon: '🔎', color: 'from-amber-600 to-yellow-600' },
  { id: 5, name: 'Transfert', shortName: '5. Transfert', icon: '🚚', color: 'from-orange-600 to-amber-700' },
  { id: 6, name: 'Éclosion', shortName: '6. Éclosion', icon: '🐣', color: 'from-teal-600 to-emerald-700' },
]

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(1)

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
              <QrCodeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight flex items-center gap-1.5">
                HATCHERY SCANNER
                <span className="text-[10px] bg-sky-500/30 text-sky-300 border border-sky-400/30 px-1.5 py-0.2 rounded font-mono">
                  v2.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">Système Mobile Industriel</p>
            </div>
          </div>

          {/* Cloud Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud DB</span>
            </div>
          </div>
        </div>

        {/* Step Navigation Bar (Horizontal Scrollable Tabs) */}
        <div className="max-w-md mx-auto px-2 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max px-2">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm">{step.icon}</span>
                  <span>{step.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Step Content */}
        {currentStep === 1 && <Step1Reception />}
        {currentStep === 2 && <Step2Triage />}
        {currentStep === 3 && <Step3Incubation />}
        {currentStep === 4 && <Step4Mirage />}
        {currentStep === 5 && <Step5Transfert />}
        {currentStep === 6 && <Step6Eclosion />}
      </div>

      {/* Persistent Bottom Bar with Step Stepper */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between text-slate-600">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-50 flex items-center gap-1"
          >
            &larr; Précédent
          </button>

          <div className="flex items-center gap-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentStep === s.id
                    ? 'w-6 bg-slate-900'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Aller à l'étape ${s.id}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
            disabled={currentStep === 6}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 flex items-center gap-1 shadow-sm"
          >
            Suivant &rarr;
          </button>
        </div>
      </nav>
    </main>
  )
}
