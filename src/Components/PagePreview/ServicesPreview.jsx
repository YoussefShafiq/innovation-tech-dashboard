import React from 'react'
import { PreviewText, PreviewSection } from './PreviewShell.jsx'

export default function ServicesPreview({ content, activeSection }) {
  const hero = content?.hero || {}
  const grid = content?.grid || {}
  const pillars = content?.profile_pillars || {}
  const process = content?.process || {}
  const why = content?.why || {}
  const pillarItems = Array.isArray(pillars.items) ? pillars.items : []
  const steps = Array.isArray(process.steps) ? process.steps : []
  const points = Array.isArray(why.points) ? why.points : []
  const stats = Array.isArray(why.stats) ? why.stats : []

  return (
    <>
      <PreviewSection active={activeSection === 'hero'}>
        <div className="page-preview-hero">
          <div className="page-preview-eyebrow">
            <PreviewText value={hero.tag} />
          </div>
          <h2 className="page-preview-title">
            <PreviewText value={hero.title} />
          </h2>
          <p className="page-preview-sub">
            <PreviewText value={hero.description} />
          </p>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'grid'}>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={grid.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={grid.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={grid.subtitle} />
          </p>
          <div className="page-preview-grid-2">
            {[1, 2].map((n) => (
              <div key={n} className="page-preview-card">
                <div className="w-8 h-8 rounded-lg bg-sky-100 mb-2" />
                <p className="font-bold text-sm">Service card</p>
                <p className="text-[11px] text-slate-400">From Services CRUD</p>
              </div>
            ))}
          </div>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'profile_pillars'}>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={pillars.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={pillars.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={pillars.subtitle} />
          </p>
          {pillarItems.slice(0, 3).map((item, i) => (
            <div key={i} className="page-preview-card">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-bold text-sm">
                  <PreviewText value={item.title} />
                </p>
                <span className="page-preview-chip">
                  <PreviewText value={item.tag} />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                <PreviewText value={item.desc} />
              </p>
            </div>
          ))}
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'process'}>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={process.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={process.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={process.subtitle} />
          </p>
          <div className="page-preview-grid-2">
            {steps.slice(0, 4).map((step, i) => (
              <div key={i} className="page-preview-card">
                <div className="page-preview-step-num">
                  <PreviewText value={step.num} fallback={String(i + 1).padStart(2, '0')} />
                </div>
                <p className="font-bold text-sm">
                  <PreviewText value={step.title} />
                </p>
                <p className="text-[11px] text-slate-500">
                  <PreviewText value={step.desc} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'why'}>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={why.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={why.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={why.subtitle} />
          </p>
          <ul className="space-y-1.5 mb-3">
            {points.slice(0, 4).map((p, i) => (
              <li key={i} className="text-xs text-slate-600 flex gap-2">
                <span className="text-sky-500">✓</span>
                <PreviewText value={typeof p === 'string' ? p : ''} />
              </li>
            ))}
          </ul>
          <span className="page-preview-btn">
            <PreviewText value={why.cta} />
          </span>
          <div className="mt-3 space-y-2">
            {stats.slice(0, 3).map((s, i) => (
              <div key={i} className="page-preview-card flex items-center gap-3">
                <span className="text-lg font-extrabold text-sky-600">
                  <PreviewText value={s.value} />
                </span>
                <div>
                  <p className="font-bold text-sm">
                    <PreviewText value={s.label} />
                  </p>
                  <p className="text-[10px] text-slate-400">
                    <PreviewText value={s.sub} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PreviewSection>
    </>
  )
}
