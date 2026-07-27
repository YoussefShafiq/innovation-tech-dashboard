import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave, FaPlus, FaTrashAlt } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { AUTH, PAGES_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'
import PreviewShell from '../PagePreview/PreviewShell.jsx'
import AboutPreview from '../PagePreview/AboutPreview.jsx'

const SECTIONS = ['hero', 'mission', 'vision', 'story', 'clutch', 'values', 'team']

function asItems(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    title: item?.title != null ? String(item.title) : '',
    description: item?.description != null ? String(item.description) : '',
  }))
}

function emptyContent() {
  return {
    hero: { breadcrumb: '', title_fallback: '', subtitle_fallback: '' },
    mission: { label: '', body: '' },
    vision: { label: '', body: '' },
    story: { tag_fallback: '', title_fallback: '', cta: '', image: '' },
    clutch: { year: '2012', title: '', label: '' },
    values: { tag: '', title: '', subtitle: '', items: [] },
    team: { tag: '', title: '', subtitle: '' },
  }
}

function apiToForm(data) {
  const content = data?.content || {}
  const arContent = data?.translations?.ar?.content || {}
  const en = emptyContent()
  const ar = emptyContent()

  const apply = (target, src) => {
    target.hero = { ...target.hero, ...(src.hero || {}) }
    target.mission = { ...target.mission, ...(src.mission || {}) }
    target.vision = { ...target.vision, ...(src.vision || {}) }
    target.story = { ...target.story, ...(src.story || {}) }
    target.clutch = { ...target.clutch, ...(src.clutch || {}) }
    target.values = {
      ...target.values,
      ...(src.values || {}),
      items: asItems(src.values?.items),
    }
    target.team = { ...target.team, ...(src.team || {}) }
  }

  apply(en, content)
  apply(ar, arContent)

  // Sync values items lengths
  const len = Math.max(en.values.items.length, ar.values.items.length)
  while (en.values.items.length < len) en.values.items.push({ title: '', description: '' })
  while (ar.values.items.length < len) ar.values.items.push({ title: '', description: '' })

  // Story image shared
  const image = en.story.image || ar.story.image || ''
  en.story.image = image
  ar.story.image = image

  return { en, ar }
}

function formToApi(formSection) {
  const s = formSection || emptyContent()
  return {
    hero: {
      breadcrumb: s.hero.breadcrumb ?? '',
      title_fallback: s.hero.title_fallback ?? '',
      subtitle_fallback: s.hero.subtitle_fallback ?? '',
    },
    mission: { label: s.mission.label ?? '', body: s.mission.body ?? '' },
    vision: { label: s.vision.label ?? '', body: s.vision.body ?? '' },
    story: {
      tag_fallback: s.story.tag_fallback ?? '',
      title_fallback: s.story.title_fallback ?? '',
      cta: s.story.cta ?? '',
      image: s.story.image ?? '',
    },
    clutch: {
      year: String(s.clutch.year ?? '2012'),
      title: s.clutch.title ?? '',
      label: s.clutch.label ?? '',
    },
    values: {
      tag: s.values.tag ?? '',
      title: s.values.title ?? '',
      subtitle: s.values.subtitle ?? '',
      items: asItems(s.values.items).filter((i) => i.title.trim() || i.description.trim()),
    },
    team: {
      tag: s.team.tag ?? '',
      title: s.team.title ?? '',
      subtitle: s.team.subtitle ?? '',
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

function ValuesList({ enItems, arItems, onChangeEn, onChangeAr, readOnly, t }) {
  const enList = Array.isArray(enItems) ? enItems : []
  const arList = Array.isArray(arItems) ? arItems : []
  const count = Math.max(enList.length, arList.length)
  const indices = Array.from({ length: count }, (_, i) => i)

  const getEn = (i) => enList[i] || { title: '', description: '' }
  const getAr = (i) => arList[i] || { title: '', description: '' }

  const updateEn = (index, field, value) => {
    const next = [...enList]
    while (next.length <= index) next.push({ title: '', description: '' })
    next[index] = { ...getEn(index), [field]: value }
    onChangeEn(next)
  }

  const updateAr = (index, field, value) => {
    const next = [...arList]
    while (next.length <= index) next.push({ title: '', description: '' })
    next[index] = { ...getAr(index), [field]: value }
    onChangeAr(next)
  }

  const removeAt = (index) => {
    onChangeEn(enList.filter((_, i) => i !== index))
    onChangeAr(arList.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onChangeEn([...enList, { title: '', description: '' }])
    onChangeAr([...arList, { title: '', description: '' }])
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{t('pages.about_fields.values_items')}</label>
        <span className="text-xs text-gray-400">{t('pages.list_count', { count })}</span>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-3 space-y-3">
        {count === 0 ? (
          <p className="text-xs text-gray-500 py-2 text-center">{t('pages.list_empty')}</p>
        ) : (
          indices.map((index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-gray-700">
                    {t('pages.item_card')} {index + 1}
                  </p>
                </div>
                {!readOnly && (
                  <button type="button" onClick={() => removeAt(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <FaTrashAlt className="text-sm" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 p-3 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('pages.english')}</p>
                  <Field label={t('pages.fields.item_title')} value={getEn(index).title} onChange={(v) => updateEn(index, 'title', v)} readOnly={readOnly} />
                  <Field label={t('pages.fields.item_desc')} value={getEn(index).description} onChange={(v) => updateEn(index, 'description', v)} readOnly={readOnly} multiline />
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-3" dir="rtl">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500 text-right">{t('pages.arabic')}</p>
                  <Field label={t('pages.fields.item_title')} value={getAr(index).title} onChange={(v) => updateAr(index, 'title', v)} readOnly={readOnly} dir="rtl" />
                  <Field label={t('pages.fields.item_desc')} value={getAr(index).description} onChange={(v) => updateAr(index, 'description', v)} readOnly={readOnly} multiline dir="rtl" />
                </div>
              </div>
            </div>
          ))
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={addItem}
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

  const setSharedImage = (value) => {
    onChangeEn({ ...en, story: { ...en.story, image: value } })
    onChangeAr({ ...ar, story: { ...ar.story, image: value } })
  }

  const scalarPairs = (() => {
    switch (sectionKey) {
      case 'hero':
        return [
          ['hero.breadcrumb', 'pages.about_fields.breadcrumb'],
          ['hero.title_fallback', 'pages.about_fields.title_fallback'],
          ['hero.subtitle_fallback', 'pages.about_fields.subtitle_fallback', { multiline: true }],
        ]
      case 'mission':
        return [
          ['mission.label', 'pages.about_fields.mission_label'],
          ['mission.body', 'pages.about_fields.mission_body', { multiline: true, rows: 4 }],
        ]
      case 'vision':
        return [
          ['vision.label', 'pages.about_fields.vision_label'],
          ['vision.body', 'pages.about_fields.vision_body', { multiline: true, rows: 4 }],
        ]
      case 'story':
        return [
          ['story.tag_fallback', 'pages.about_fields.story_tag'],
          ['story.title_fallback', 'pages.about_fields.story_title'],
          ['story.cta', 'pages.about_fields.story_cta'],
        ]
      case 'clutch':
        return [
          ['clutch.year', 'pages.about_fields.clutch_year'],
          ['clutch.title', 'pages.about_fields.clutch_title'],
          ['clutch.label', 'pages.about_fields.clutch_label'],
        ]
      case 'values':
        return [
          ['values.tag', 'pages.fields.tag'],
          ['values.title', 'pages.fields.title'],
          ['values.subtitle', 'pages.fields.subtitle', { multiline: true }],
        ]
      case 'team':
        return [
          ['team.tag', 'pages.fields.tag'],
          ['team.title', 'pages.fields.title'],
          ['team.subtitle', 'pages.fields.subtitle', { multiline: true }],
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

      {sectionKey === 'story' && (
        <div className="border rounded-xl p-4 space-y-3">
          <Field
            label={t('pages.about_fields.story_image')}
            value={en.story.image || ''}
            onChange={setSharedImage}
            readOnly={readOnly}
            dir="ltr"
          />
          {(en.story.image || '').trim() ? (
            <img src={en.story.image} alt="" className="h-40 w-auto max-w-full rounded-lg object-cover border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          ) : null}
          <p className="text-xs text-gray-500">{t('pages.about_hints.story_image')}</p>
        </div>
      )}

      {sectionKey === 'values' && (
        <ValuesList
          enItems={en.values.items}
          arItems={ar.values.items}
          onChangeEn={(items) => onChangeEn({ ...en, values: { ...en.values, items } })}
          onChangeAr={(items) => onChangeAr({ ...ar, values: { ...ar.values, items } })}
          readOnly={readOnly}
          t={t}
        />
      )}
    </div>
  )
}

export default function AboutPageEditor() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState('hero')
  const [previewLocale, setPreviewLocale] = useState('en')
  const [form, setForm] = useState(() => ({ en: emptyContent(), ar: emptyContent() }))

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])
  const canView = account?.permissions?.includes('view_pages')
  const canEdit = account?.permissions?.includes('edit_pages')

  const { data: pageRes, isLoading, isError, error } = useQuery({
    queryKey: ['pageContent', 'about'],
    queryFn: () => axios.get(PAGES_API.detail('about'), { headers: authHeaders() }),
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
      // Shared story image
      const image = content.story.image || arContent.story.image || ''
      content.story.image = image
      arContent.story.image = image

      // Align values items
      const n = Math.max(content.values.items.length, arContent.values.items.length)
      while (content.values.items.length < n) content.values.items.push({ title: '', description: '' })
      while (arContent.values.items.length < n) arContent.values.items.push({ title: '', description: '' })
      const paired = []
      for (let i = 0; i < n; i++) {
        const enItem = content.values.items[i]
        const arItem = arContent.values.items[i]
        if (!enItem.title && !enItem.description && !arItem.title && !arItem.description) continue
        paired.push({ en: enItem, ar: arItem })
      }
      content.values.items = paired.map((p) => p.en)
      arContent.values.items = paired.map((p) => p.ar)

      return axios.put(
        PAGES_API.detail('about'),
        { content, translations: { ar: { content: arContent } } },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
      )
    },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 2000 })
      queryClient.invalidateQueries({ queryKey: ['pageContent', 'about'] })
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
        <h1 className="text-3xl font-bold text-gray-800">{t('pages.about_title')}</h1>
        <p className="text-gray-600 text-sm mt-1 max-w-3xl">
          {t('pages.about_subtitle')}{' '}
          <Link to="/settings" className="text-primary underline">{t('sidebar.settings')}</Link>
          {' · '}
          <Link to="/team-members" className="text-primary underline">{t('sidebar.team')}</Link>
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
            {t(`pages.about_sections.${key}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-6 items-start mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
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

        <PreviewShell
          title={t(`pages.about_sections.${activeSection}`)}
          previewLocale={previewLocale}
          onPreviewLocaleChange={setPreviewLocale}
        >
          <AboutPreview content={form[previewLocale]} activeSection={activeSection} />
        </PreviewShell>
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
