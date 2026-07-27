import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave, FaPlus, FaTrashAlt } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { AUTH, PAGES_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

const SECTIONS = ['brand', 'nav', 'footer']
const SOCIAL_NETWORKS = ['facebook', 'twitter', 'linkedin', 'instagram']
const FIXED_NAV_PATHS = ['/', '/about', '/services', '/contact']

function asLinks(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    label: item?.label != null ? String(item.label) : '',
    path: item?.path != null ? String(item.path) : '',
  }))
}

function mergeFixedNavLinks(enLinks, arLinks) {
  const enByPath = Object.fromEntries(asLinks(enLinks).map((l) => [l.path, l]))
  const arByPath = Object.fromEntries(asLinks(arLinks).map((l) => [l.path, l]))
  // Also match by index if paths were wrong historically
  const enArr = asLinks(enLinks)
  const arArr = asLinks(arLinks)

  return FIXED_NAV_PATHS.map((path, i) => ({
    en: {
      path,
      label: enByPath[path]?.label || enArr[i]?.label || '',
    },
    ar: {
      path,
      label: arByPath[path]?.label || arArr[i]?.label || '',
    },
  }))
}

function asSocials(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    network: item?.network != null ? String(item.network) : 'facebook',
    url: item?.url != null ? String(item.url) : '',
    label: item?.label != null ? String(item.label) : '',
  }))
}

function emptyContent() {
  return {
    brand: { name_first: '', name_second: '' },
    nav: {
      cta_label: '',
      cta_path: '/contact',
      links: FIXED_NAV_PATHS.map((path) => ({ label: '', path })),
    },
    footer: {
      description: '',
      quick_links_heading: '',
      contact_heading: '',
      rights: '',
      socials: [],
    },
  }
}

function syncLengths(enList, arList, emptyItem) {
  const len = Math.max(enList.length, arList.length)
  while (enList.length < len) enList.push({ ...emptyItem })
  while (arList.length < len) arList.push({ ...emptyItem })
}

function apiToForm(data) {
  const content = data?.content || {}
  const arContent = data?.translations?.ar?.content || {}
  const en = emptyContent()
  const ar = emptyContent()

  const apply = (target, src) => {
    target.brand = { ...target.brand, ...(src.brand || {}) }
    target.nav = {
      ...target.nav,
      ...(src.nav || {}),
      links: asLinks(src.nav?.links),
    }
    target.footer = {
      description: '',
      quick_links_heading: '',
      contact_heading: '',
      rights: '',
      socials: [],
      ...(src.footer || {}),
      socials: asSocials(src.footer?.socials),
    }
    // Strip legacy privacy/terms if present
    delete target.footer.privacy_label
    delete target.footer.privacy_path
    delete target.footer.terms_label
    delete target.footer.terms_path
  }

  apply(en, content)
  apply(ar, arContent)

  const merged = mergeFixedNavLinks(en.nav.links, ar.nav.links)
  en.nav.links = merged.map((m) => m.en)
  ar.nav.links = merged.map((m) => m.ar)

  syncLengths(en.footer.socials, ar.footer.socials, { network: 'facebook', url: '', label: '' })

  const ctaPath = '/contact'
  en.nav.cta_path = ctaPath
  ar.nav.cta_path = ctaPath

  for (let i = 0; i < en.footer.socials.length; i++) {
    const network = en.footer.socials[i].network || ar.footer.socials[i].network || 'facebook'
    const url = en.footer.socials[i].url || ar.footer.socials[i].url || ''
    en.footer.socials[i].network = network
    ar.footer.socials[i].network = network
    en.footer.socials[i].url = url
    ar.footer.socials[i].url = url
  }

  return { en, ar }
}

function formToApi(formSection) {
  const s = formSection || emptyContent()
  const byPath = Object.fromEntries(asLinks(s.nav.links).map((l) => [l.path, l]))
  return {
    brand: {
      name_first: s.brand.name_first ?? '',
      name_second: s.brand.name_second ?? '',
    },
    nav: {
      cta_label: s.nav.cta_label ?? '',
      cta_path: '/contact',
      links: FIXED_NAV_PATHS.map((path) => ({
        path,
        label: byPath[path]?.label ?? '',
      })),
    },
    footer: {
      description: s.footer.description ?? '',
      quick_links_heading: s.footer.quick_links_heading ?? '',
      contact_heading: s.footer.contact_heading ?? '',
      rights: s.footer.rights ?? '',
      socials: asSocials(s.footer.socials),
    },
  }
}

function Field({ label, value, onChange, readOnly, multiline = false, rows = 3, dir }) {
  const cls = readOnly
    ? 'w-full px-3 py-2 border rounded-md bg-gray-50'
    : 'w-full px-3 py-2 border rounded-md'
  return (
    <div className={dir === 'rtl' ? 'text-right' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} ${dir === 'rtl' ? 'text-right' : ''}`}
          readOnly={readOnly}
          dir={dir}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} ${dir === 'rtl' ? 'text-right' : ''}`}
          readOnly={readOnly}
          dir={dir}
        />
      )}
    </div>
  )
}

function NavLinksList({ enItems, arItems, onChangeEn, onChangeAr, readOnly, t }) {
  const enList = Array.isArray(enItems) ? enItems : []
  const arList = Array.isArray(arItems) ? arItems : []

  const getEn = (path) => enList.find((l) => l.path === path) || { label: '', path }
  const getAr = (path) => arList.find((l) => l.path === path) || { label: '', path }

  const updateEnLabel = (path, label) => {
    onChangeEn(
      FIXED_NAV_PATHS.map((p) => ({
        path: p,
        label: p === path ? label : getEn(p).label,
      }))
    )
  }

  const updateArLabel = (path, label) => {
    onChangeAr(
      FIXED_NAV_PATHS.map((p) => ({
        path: p,
        label: p === path ? label : getAr(p).label,
      }))
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{t('pages.layout_fields.nav_links')}</label>
        <span className="text-xs text-gray-400">{t('pages.list_count', { count: FIXED_NAV_PATHS.length })}</span>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-3 space-y-3">
        {FIXED_NAV_PATHS.map((path, index) => (
          <div key={path} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-700">
                {t('pages.item_card')} {index + 1}
              </p>
              <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" dir="ltr">
                {path}
              </code>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field
                label={t('pages.english')}
                value={getEn(path).label}
                onChange={(v) => updateEnLabel(path, v)}
                readOnly={readOnly}
              />
              <Field
                label={t('pages.arabic')}
                value={getAr(path).label}
                onChange={(v) => updateArLabel(path, v)}
                readOnly={readOnly}
                dir="rtl"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SocialsList({ enItems, arItems, onChangeEn, onChangeAr, readOnly, t }) {
  const enList = Array.isArray(enItems) ? enItems : []
  const arList = Array.isArray(arItems) ? arItems : []
  const count = Math.max(enList.length, arList.length)

  const getEn = (i) => enList[i] || { network: 'facebook', url: '', label: '' }
  const getAr = (i) => arList[i] || { network: 'facebook', url: '', label: '' }

  const updateShared = (index, field, value) => {
    const nextEn = [...enList]
    const nextAr = [...arList]
    while (nextEn.length <= index) nextEn.push({ network: 'facebook', url: '', label: '' })
    while (nextAr.length <= index) nextAr.push({ network: 'facebook', url: '', label: '' })
    nextEn[index] = { ...getEn(index), [field]: value }
    nextAr[index] = { ...getAr(index), [field]: value }
    onChangeEn(nextEn)
    onChangeAr(nextAr)
  }

  const updateEnLabel = (index, label) => {
    const next = [...enList]
    while (next.length <= index) next.push({ network: 'facebook', url: '', label: '' })
    next[index] = { ...getEn(index), label }
    onChangeEn(next)
  }

  const updateArLabel = (index, label) => {
    const next = [...arList]
    while (next.length <= index) next.push({ network: 'facebook', url: '', label: '' })
    next[index] = { ...getAr(index), label }
    onChangeAr(next)
  }

  const removeAt = (index) => {
    onChangeEn(enList.filter((_, i) => i !== index))
    onChangeAr(arList.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{t('pages.layout_fields.socials')}</label>
        <span className="text-xs text-gray-400">{t('pages.list_count', { count })}</span>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-3 space-y-3">
        {count === 0 ? (
          <p className="text-xs text-gray-500 py-2 text-center">{t('pages.list_empty')}</p>
        ) : (
          Array.from({ length: count }, (_, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">{t('pages.item_card')} {index + 1}</p>
                {!readOnly && (
                  <button type="button" onClick={() => removeAt(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <FaTrashAlt className="text-sm" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.layout_fields.network')}</label>
                  <select
                    value={getEn(index).network}
                    onChange={(e) => updateShared(index, 'network', e.target.value)}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border rounded-md bg-white disabled:bg-gray-50"
                  >
                    {SOCIAL_NETWORKS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <Field
                  label={t('pages.layout_fields.url')}
                  value={getEn(index).url}
                  onChange={(v) => updateShared(index, 'url', v)}
                  readOnly={readOnly}
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Field label={t('pages.english')} value={getEn(index).label} onChange={(v) => updateEnLabel(index, v)} readOnly={readOnly} />
                <Field label={t('pages.arabic')} value={getAr(index).label} onChange={(v) => updateArLabel(index, v)} readOnly={readOnly} dir="rtl" />
              </div>
            </div>
          ))
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              onChangeEn([...enList, { network: 'facebook', url: '', label: '' }])
              onChangeAr([...arList, { network: 'facebook', url: '', label: '' }])
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-primary/30 text-primary bg-white hover:bg-primary/5 text-sm font-medium"
          >
            <FaPlus className="text-xs" />
            {t('pages.add_item')}
          </button>
        )}
      </div>
    </div>
  )
}

function SectionEditor({ sectionKey, en, ar, onChangeEn, onChangeAr, readOnly, t }) {
  const setEn = (path, value) => {
    const [section, field] = path.split('.')
    onChangeEn({ ...en, [section]: { ...en[section], [field]: value } })
  }
  const setAr = (path, value) => {
    const [section, field] = path.split('.')
    onChangeAr({ ...ar, [section]: { ...ar[section], [field]: value } })
  }

  const scalarPairs = (() => {
    switch (sectionKey) {
      case 'brand':
        return [
          ['brand.name_first', 'pages.layout_fields.name_first'],
          ['brand.name_second', 'pages.layout_fields.name_second'],
        ]
      case 'nav':
        return [
          ['nav.cta_label', 'pages.layout_fields.cta_label'],
        ]
      case 'footer':
        return [
          ['footer.description', 'pages.layout_fields.description', { multiline: true, rows: 3 }],
          ['footer.quick_links_heading', 'pages.layout_fields.quick_links_heading'],
          ['footer.contact_heading', 'pages.layout_fields.contact_heading'],
          ['footer.rights', 'pages.layout_fields.rights'],
        ]
      default:
        return []
    }
  })()

  const getVal = (obj, path) => {
    const [section, field] = path.split('.')
    return obj?.[section]?.[field] ?? ''
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 border rounded-xl p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('pages.english')}</h3>
          {scalarPairs.map(([path, labelKey, opts]) => (
            <Field
              key={`en-${path}`}
              label={t(labelKey)}
              value={getVal(en, path)}
              onChange={(v) => setEn(path, v)}
              readOnly={readOnly}
              multiline={!!opts?.multiline}
              rows={opts?.rows || 3}
            />
          ))}
        </div>
        <div className="space-y-4 border rounded-xl p-4 border-blue-100 bg-blue-50/40" dir="rtl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500">{t('pages.arabic')}</h3>
          {scalarPairs.map(([path, labelKey, opts]) => (
            <Field
              key={`ar-${path}`}
              label={t(labelKey)}
              value={getVal(ar, path)}
              onChange={(v) => setAr(path, v)}
              readOnly={readOnly}
              multiline={!!opts?.multiline}
              rows={opts?.rows || 3}
              dir="rtl"
            />
          ))}
        </div>
      </div>

      {sectionKey === 'nav' && (
        <NavLinksList
          enItems={en.nav.links}
          arItems={ar.nav.links}
          onChangeEn={(links) => onChangeEn({ ...en, nav: { ...en.nav, links } })}
          onChangeAr={(links) => onChangeAr({ ...ar, nav: { ...ar.nav, links } })}
          readOnly={readOnly}
          t={t}
        />
      )}

      {sectionKey === 'footer' && (
        <SocialsList
          enItems={en.footer.socials}
          arItems={ar.footer.socials}
          onChangeEn={(socials) => onChangeEn({ ...en, footer: { ...en.footer, socials } })}
          onChangeAr={(socials) => onChangeAr({ ...ar, footer: { ...ar.footer, socials } })}
          readOnly={readOnly}
          t={t}
        />
      )}
    </div>
  )
}

function pairFilter(enList, arList, isEmpty) {
  const n = Math.max(enList.length, arList.length)
  const paired = []
  for (let i = 0; i < n; i++) {
    const enItem = enList[i]
    const arItem = arList[i]
    if (isEmpty(enItem, arItem)) continue
    paired.push({ en: enItem, ar: arItem })
  }
  return { en: paired.map((p) => p.en), ar: paired.map((p) => p.ar) }
}

export default function LayoutPageEditor() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState('brand')
  const [form, setForm] = useState(() => ({ en: emptyContent(), ar: emptyContent() }))

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])
  const canView = account?.permissions?.includes('view_pages')
  const canEdit = account?.permissions?.includes('edit_pages')

  const { data: pageRes, isLoading, isError, error } = useQuery({
    queryKey: ['pageContent', 'layout'],
    queryFn: () => axios.get(PAGES_API.detail('layout'), { headers: authHeaders() }),
    enabled: !profileLoading && !!canView,
  })

  useEffect(() => {
    const d = pageRes?.data?.data
    if (d) setForm(apiToForm(d))
  }, [pageRes])

  useEffect(() => {
    if (!isError || !error) return
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('userToken')
      navigate('/login')
    }
    if (status === 403) {
      toast.error(t('pages.not_authorized'))
      navigate('/')
    }
  }, [isError, error, navigate, t])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = formToApi(form.en)
      const arContent = formToApi(form.ar)

      const ctaPath = '/contact'
      content.nav.cta_path = ctaPath
      arContent.nav.cta_path = ctaPath

      // Force canonical nav paths; keep bilingual labels from form
      content.nav.links = FIXED_NAV_PATHS.map((path) => ({
        path,
        label: content.nav.links.find((l) => l.path === path)?.label ?? '',
      }))
      arContent.nav.links = FIXED_NAV_PATHS.map((path) => ({
        path,
        label: arContent.nav.links.find((l) => l.path === path)?.label ?? '',
      }))

      const socials = pairFilter(
        content.footer.socials,
        arContent.footer.socials,
        (enItem, arItem) => !enItem?.label && !arItem?.label && !enItem?.url && !arItem?.url
      )
      content.footer.socials = socials.en.map((s, i) => ({
        ...s,
        network: s.network || socials.ar[i]?.network || 'facebook',
        url: s.url || socials.ar[i]?.url || '',
      }))
      arContent.footer.socials = socials.ar.map((s, i) => ({
        ...s,
        network: content.footer.socials[i].network,
        url: content.footer.socials[i].url,
      }))

      return axios.put(
        PAGES_API.detail('layout'),
        { content, translations: { ar: { content: arContent } } },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
      )
    },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 2000 })
      queryClient.invalidateQueries({ queryKey: ['pageContent', 'layout'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('pages.save_failed'), { duration: 4000 })
      if (err.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    },
  })

  if (profileLoading) {
    return (
      <div className="p-4 flex items-center gap-2 text-gray-600">
        <FaSpinner className="animate-spin" />
        {t('common.loading')}
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="p-4">
        <p className="text-gray-600">{t('pages.no_permission')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('pages.layout_title')}</h1>
        <p className="text-gray-600 text-sm mt-1 max-w-3xl">
          {t('pages.layout_subtitle')}{' '}
          <Link to="/settings" className="text-primary underline">{t('sidebar.settings')}</Link>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveSection(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              activeSection === key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40'
            }`}
          >
            {t(`pages.layout_sections.${key}`)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600 py-12 justify-center">
            <FaSpinner className="animate-spin" />
            {t('common.loading')}
          </div>
        ) : (
          <SectionEditor
            sectionKey={activeSection}
            en={form.en}
            ar={form.ar}
            onChangeEn={(next) => setForm((prev) => ({ ...prev, en: next }))}
            onChangeAr={(next) => setForm((prev) => ({ ...prev, ar: next }))}
            readOnly={!canEdit}
            t={t}
          />
        )}
      </div>

      {canEdit && !isLoading && (
        <div className="flex justify-end sticky bottom-4 z-10">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-xl hover:bg-darkBlue transition-all shadow-lg disabled:opacity-50 active:scale-95"
          >
            {saveMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaSave className="text-xl" />}
            <span className="font-semibold">{t('common.save_changes')}</span>
          </button>
        </div>
      )}
    </div>
  )
}
