import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import './previewTheme.css'

/**
 * Sticky live-preview chrome for CMS page editors.
 */
export default function PreviewShell({
  title,
  previewLocale,
  onPreviewLocaleChange,
  children,
  defaultOpenOnMobile = false,
}) {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(defaultOpenOnMobile)
  const isRtl = previewLocale === 'ar'

  return (
    <aside className="xl:sticky xl:top-4 xl:self-start w-full">
      <div className="xl:hidden mb-3">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-white text-primary text-sm font-semibold hover:bg-primary/5"
        >
          {mobileOpen ? <FaEyeSlash /> : <FaEye />}
          {mobileOpen ? t('pages.preview_hide') : t('pages.preview_show')}
        </button>
      </div>

      <div className={`${mobileOpen ? 'block' : 'hidden'} xl:block`}>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {t('pages.preview_live')}
              </p>
              <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0" role="group" aria-label={t('pages.preview_language')}>
              {['en', 'ar'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => onPreviewLocaleChange(loc)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                    previewLocale === loc
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/40'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`page-preview ${isRtl ? 'is-rtl' : ''}`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="page-preview-frame">{children}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export function PreviewText({ value, fallback, className = '' }) {
  const { t } = useTranslation()
  const text = typeof value === 'string' && value.trim() !== '' ? value : null
  if (text) return <span className={className}>{text}</span>
  return (
    <span className={`page-preview-placeholder ${className}`}>
      {fallback || t('pages.preview_empty')}
    </span>
  )
}

export function PreviewSection({ active, children, className = '' }) {
  return (
    <div
      className={`page-preview-section ${active ? 'is-active' : 'is-dimmed'} ${className}`}
      aria-hidden={!active}
    >
      {children}
    </div>
  )
}
