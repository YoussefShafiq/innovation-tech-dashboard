import React from 'react'
import { PreviewText, PreviewSection } from './PreviewShell.jsx'

export default function LayoutPreview({ content, activeSection }) {
  const brand = content?.brand || {}
  const nav = content?.nav || {}
  const footer = content?.footer || {}
  const links = Array.isArray(nav.links) ? nav.links : []
  const socials = Array.isArray(footer.socials) ? footer.socials : []

  return (
    <>
      <PreviewSection active={activeSection === 'brand' || activeSection === 'nav'}>
        <div className="page-preview-nav">
          <div className="page-preview-nav-brand">
            <span>
              <PreviewText value={brand.name_first} fallback="Brand" />
            </span>
            <span>
              <PreviewText value={brand.name_second} fallback="" />
            </span>
          </div>
          <div className="page-preview-nav-links">
            {links.slice(0, 4).map((l) => (
              <span key={l.path || l.label}>
                <PreviewText value={l.label} fallback="Link" />
              </span>
            ))}
          </div>
          <span className="page-preview-btn" style={{ marginTop: 0, padding: '0.3rem 0.65rem' }}>
            <PreviewText value={nav.cta_label} fallback="CTA" />
          </span>
        </div>
        {activeSection === 'nav' && (
          <div className="page-preview-body">
            <p className="text-xs text-slate-500 mb-2">Nav links</p>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.path} className="page-preview-card flex items-center justify-between gap-2 text-sm">
                  <PreviewText value={l.label} />
                  <code className="text-[10px] text-slate-400" dir="ltr">
                    {l.path}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PreviewSection>

      <PreviewSection active={activeSection === 'footer'}>
        <div className="page-preview-footer">
          <div className="page-preview-nav-brand mb-2 text-white">
            <span>
              <PreviewText value={brand.name_first} />
            </span>
            <span>
              <PreviewText value={brand.name_second} />
            </span>
          </div>
          <p className="opacity-70 mb-4 leading-relaxed">
            <PreviewText value={footer.description} />
          </p>
          <div className="page-preview-grid-2 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-2">
                <PreviewText value={footer.quick_links_heading} />
              </p>
              <ul className="space-y-1 opacity-80">
                {links.map((l) => (
                  <li key={`f-${l.path}`}>
                    <PreviewText value={l.label} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-2">
                <PreviewText value={footer.contact_heading} />
              </p>
              <p className="opacity-70 text-[11px] leading-relaxed">Email / phone / address from Settings</p>
            </div>
          </div>
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {socials.map((s, i) => (
                <span key={i} className="page-preview-chip" style={{ background: 'rgba(14,165,233,0.2)', color: '#7dd3fc' }}>
                  <PreviewText value={s.label || s.network} />
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] opacity-50 border-t border-white/10 pt-3">
            © {new Date().getFullYear()}{' '}
            <PreviewText value={[brand.name_first, brand.name_second].filter(Boolean).join(' ')} />
            . <PreviewText value={footer.rights} />
          </p>
        </div>
      </PreviewSection>
    </>
  )
}
