import React from 'react'
import { PreviewText, PreviewSection } from './PreviewShell.jsx'

export default function ContactPreview({ content, activeSection }) {
  const hero = content?.hero || {}
  const info = content?.info || {}
  const form = content?.form || {}

  return (
    <>
      <PreviewSection active={activeSection === 'hero'}>
        <div className="page-preview-hero">
          <div className="page-preview-eyebrow">
            <PreviewText value={hero.eyebrow} />
          </div>
          <h2 className="page-preview-title">
            <PreviewText value={hero.title} />
          </h2>
          <p className="page-preview-sub">
            <PreviewText value={hero.description} />
          </p>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'info'}>
        <div className="page-preview-body space-y-3">
          <div className="page-preview-tag">
            <PreviewText value={info.tag} />
          </div>
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={info.title} />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            <PreviewText value={info.subtitle} />
          </p>
          <div className="page-preview-card">
            <div className="page-preview-label">
              <PreviewText value={info.email_label} />
            </div>
            <p className="text-sm font-semibold text-slate-700">hello@example.com</p>
          </div>
          <div className="page-preview-card">
            <div className="page-preview-label">
              <PreviewText value={info.phone_label} />
            </div>
            <p className="text-sm font-semibold text-slate-700">+20 000 000 0000</p>
          </div>
          <div className="page-preview-card">
            <div className="page-preview-label">
              <PreviewText value={info.office_label} />
            </div>
            <p className="text-sm font-semibold text-slate-700">Office address (Settings)</p>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection active={activeSection === 'form'}>
        <div className="page-preview-body">
          <h3 className="page-preview-title" style={{ fontSize: '1.1rem', textAlign: 'start' }}>
            <PreviewText value={form.title} />
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <PreviewText value={form.subtitle} />
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="page-preview-label">
                <PreviewText value={form.name_label} />
              </div>
              <input className="page-preview-input" disabled placeholder={form.name_placeholder || '…'} />
            </div>
            <div>
              <div className="page-preview-label">
                <PreviewText value={form.email_label} />
              </div>
              <input className="page-preview-input" disabled placeholder={form.email_placeholder || '…'} />
            </div>
          </div>
          <div className="mb-2">
            <div className="page-preview-label">
              <PreviewText value={form.subject_label} />
            </div>
            <input className="page-preview-input" disabled placeholder={form.subject_placeholder || '…'} />
          </div>
          <div>
            <div className="page-preview-label">
              <PreviewText value={form.message_label} />
            </div>
            <textarea className="page-preview-input" disabled rows={3} placeholder={form.message_placeholder || '…'} />
          </div>
          <span className="page-preview-btn">
            <PreviewText value={form.submit} />
          </span>
        </div>
      </PreviewSection>
    </>
  )
}
