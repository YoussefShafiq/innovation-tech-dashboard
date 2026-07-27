import React from 'react'
import { PreviewText, PreviewSection } from './PreviewShell.jsx'

export default function HomePreview({ content, activeSection }) {
  // Home editor stores form as { en: { hero, about_strip, ... }, ar: { ... } }
  // content here is already one locale object with section keys
  const section = content?.[activeSection] || content || {}

  if (activeSection === 'hero') {
    const words = Array.isArray(section.hero_words) ? section.hero_words : []
    const images = Array.isArray(section.hero_images) ? section.hero_images : []
    return (
      <PreviewSection active>
        <div className="page-preview-hero">
          <div className="page-preview-eyebrow">
            <PreviewText value={section.badge} />
          </div>
          <h2 className="page-preview-title">
            <PreviewText value={section.title_part1} />{' '}
            <span className="text-sky-400">
              <PreviewText value={words[0]} fallback="…" />
            </span>
            <br />
            <PreviewText value={section.title_part2} />
          </h2>
          <p className="page-preview-sub">
            <PreviewText value={section.description} />
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            <span className="page-preview-btn" style={{ marginTop: 0 }}>
              <PreviewText value={section.cta_primary} />
            </span>
            <span className="page-preview-btn" style={{ marginTop: 0, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)' }}>
              <PreviewText value={section.cta_secondary} />
            </span>
          </div>
          {images[0] && (
            <img src={images[0]} alt="" className="mt-4 rounded-xl max-h-28 object-cover w-full opacity-90" />
          )}
        </div>
      </PreviewSection>
    )
  }

  if (activeSection === 'about_strip') {
    const bullets = Array.isArray(section.bullets) ? section.bullets : []
    return (
      <PreviewSection active>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={section.who_tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.05rem', textAlign: 'start' }}>
            <PreviewText value={section.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            <PreviewText value={section.p1} />
          </p>
          <ul className="space-y-1 mb-2">
            {bullets.slice(0, 3).map((b, i) => (
              <li key={i} className="text-xs text-slate-600">
                • <PreviewText value={b} />
              </li>
            ))}
          </ul>
          <span className="page-preview-btn">
            <PreviewText value={section.cta} />
          </span>
        </div>
      </PreviewSection>
    )
  }

  if (activeSection === 'why' || activeSection === 'pillars') {
    const items = Array.isArray(section.items) ? section.items : []
    return (
      <PreviewSection active>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={section.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.05rem', textAlign: 'start' }}>
            <PreviewText value={section.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={section.subtitle} />
          </p>
          <div className="page-preview-grid-2">
            {items.slice(0, 4).map((item, i) => (
              <div key={i} className="page-preview-card">
                <p className="font-bold text-sm mb-1">
                  <PreviewText value={item.title} />
                </p>
                <p className="text-[11px] text-slate-500">
                  <PreviewText value={item.desc || item.description} />
                </p>
              </div>
            ))}
          </div>
          {section.cta && (
            <span className="page-preview-btn">
              <PreviewText value={section.cta} />
            </span>
          )}
        </div>
      </PreviewSection>
    )
  }

  if (activeSection === 'partners' || activeSection === 'services') {
    return (
      <PreviewSection active>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={section.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.05rem', textAlign: 'start' }}>
            <PreviewText value={section.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={section.subtitle} />
          </p>
          {section.cta && (
            <span className="page-preview-btn">
              <PreviewText value={section.cta} />
            </span>
          )}
          <p className="text-[11px] text-slate-400 mt-3">
            {activeSection === 'partners' ? 'Partner logos from Partners' : 'Service cards from Services'}
          </p>
        </div>
      </PreviewSection>
    )
  }

  if (activeSection === 'fulfillment') {
    const bullets = Array.isArray(section.bullets) ? section.bullets : []
    return (
      <PreviewSection active>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={section.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.05rem', textAlign: 'start' }}>
            <PreviewText value={section.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            <PreviewText value={section.p1} />
          </p>
          <ul className="space-y-1 mb-2">
            {bullets.slice(0, 3).map((b, i) => (
              <li key={i} className="text-xs text-slate-600">
                • <PreviewText value={b} />
              </li>
            ))}
          </ul>
          <div className="page-preview-grid-2">
            <div className="page-preview-card">
              <p className="font-bold text-sm">
                <PreviewText value={section.card1_title} />
              </p>
              <p className="text-[11px] text-slate-500">
                <PreviewText value={section.card1_sub} />
              </p>
            </div>
            <div className="page-preview-card">
              <p className="font-bold text-sm">
                <PreviewText value={section.card2_title} />
              </p>
              <p className="text-[11px] text-slate-500">
                <PreviewText value={section.card2_sub} />
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>
    )
  }

  if (activeSection === 'process') {
    const steps = Array.isArray(section.steps) ? section.steps : []
    return (
      <PreviewSection active>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={section.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.05rem', textAlign: 'start' }}>
            <PreviewText value={section.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={section.subtitle} />
          </p>
          <div className="page-preview-grid-2">
            {steps.slice(0, 4).map((step, i) => (
              <div key={i} className="page-preview-card">
                <div className="page-preview-step-num">
                  <PreviewText value={step.n || step.num} fallback={String(i + 1).padStart(2, '0')} />
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
    )
  }

  if (activeSection === 'testimonials') {
    const quotes = Array.isArray(section.quotes) ? section.quotes : []
    return (
      <PreviewSection active>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={section.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.05rem', textAlign: 'start' }}>
            <PreviewText value={section.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={section.subtitle} />
          </p>
          {quotes.slice(0, 2).map((q, i) => (
            <div key={i} className="page-preview-card">
              <p className="text-xs italic text-slate-600 mb-2">
                “<PreviewText value={q.quote} />”
              </p>
              <p className="text-[11px] font-semibold">
                <PreviewText value={q.name} />
              </p>
              <p className="text-[10px] text-slate-400">
                <PreviewText value={q.org} />
              </p>
            </div>
          ))}
        </div>
      </PreviewSection>
    )
  }

  if (activeSection === 'cta') {
    return (
      <PreviewSection active>
        <div className="page-preview-hero" style={{ borderRadius: 0 }}>
          <h2 className="page-preview-title">
            <PreviewText value={section.title} />
          </h2>
          <p className="page-preview-sub">
            <PreviewText value={section.description} />
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            <span className="page-preview-btn" style={{ marginTop: 0 }}>
              <PreviewText value={section.primary} />
            </span>
            <span className="page-preview-btn" style={{ marginTop: 0, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)' }}>
              <PreviewText value={section.secondary} />
            </span>
          </div>
        </div>
      </PreviewSection>
    )
  }

  return (
    <PreviewSection active>
      <div className="page-preview-body text-xs text-slate-400">No preview for this section.</div>
    </PreviewSection>
  )
}
