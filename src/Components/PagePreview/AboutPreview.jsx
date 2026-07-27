import React from 'react'
import { PreviewText, PreviewSection } from './PreviewShell.jsx'

export default function AboutPreview({ content, activeSection }) {
  const hero = content?.hero || {}
  const mission = content?.mission || {}
  const vision = content?.vision || {}
  const story = content?.story || {}
  const clutch = content?.clutch || {}
  const values = content?.values || {}
  const team = content?.team || {}
  const valueItems = Array.isArray(values.items) ? values.items : []

  return (
    <>
      <PreviewSection active={activeSection === 'hero'}>
        <div className="page-preview-hero">
          <div className="page-preview-eyebrow">
            <PreviewText value={hero.breadcrumb} />
          </div>
          <h2 className="page-preview-title">
            <PreviewText value={hero.title_fallback} />
          </h2>
          <p className="page-preview-sub">
            <PreviewText value={hero.subtitle_fallback} />
          </p>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'mission'}>
        <div className="page-preview-body">
          <div className="page-preview-card">
            <div className="page-preview-label text-sky-600">
              <PreviewText value={mission.label} />
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              <PreviewText value={mission.body} />
            </p>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'vision'}>
        <div className="page-preview-body">
          <div className="page-preview-card">
            <div className="page-preview-label text-sky-600">
              <PreviewText value={vision.label} />
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              <PreviewText value={vision.body} />
            </p>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'story'}>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={story.tag_fallback} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={story.title_fallback} />
          </h3>
          <span className="page-preview-btn">
            <PreviewText value={story.cta} />
          </span>
          {story.image ? (
            <img src={story.image} alt="" className="mt-3 rounded-xl max-h-32 object-cover w-full border" />
          ) : (
            <div className="mt-3 h-24 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              Story image
            </div>
          )}
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'clutch'}>
        <div className="page-preview-body">
          <div className="page-preview-card flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 font-extrabold text-sm flex items-center justify-center">
              <PreviewText value={clutch.year} fallback="—" />
            </span>
            <div>
              <p className="font-bold text-sm">
                <PreviewText value={clutch.title} />
              </p>
              <p className="text-xs text-slate-500">
                <PreviewText value={clutch.label} />
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'values'}>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={values.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={values.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={values.subtitle} />
          </p>
          <div className="page-preview-grid-2">
            {valueItems.slice(0, 4).map((item, i) => (
              <div key={i} className="page-preview-card">
                <p className="font-bold text-sm mb-1">
                  <PreviewText value={item.title} />
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <PreviewText value={item.description} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'team'}>
        <div className="page-preview-body">
          <div className="page-preview-tag">
            <PreviewText value={team.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={team.title} />
          </h3>
          <p className="text-xs text-slate-500">
            <PreviewText value={team.subtitle} />
          </p>
          <p className="text-[11px] text-slate-400 mt-3">Team cards from Team Members</p>
        </div>
      </PreviewSection>
    </>
  )
}
