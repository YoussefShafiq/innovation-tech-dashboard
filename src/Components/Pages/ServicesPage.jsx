import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave, FaPlus, FaTrashAlt } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { AUTH, PAGES_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

const SECTIONS = ['hero', 'grid', 'profile_pillars', 'process', 'why']

function asPillars(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    title: item?.title != null ? String(item.title) : '',
    desc: item?.desc != null ? String(item.desc) : '',
    tag: item?.tag != null ? String(item.tag) : '',
  }))
}

function asSteps(list) {
  if (!Array.isArray(list)) return []
  return list.map((item, i) => ({
    num: item?.num != null ? String(item.num) : String(i + 1).padStart(2, '0'),
    title: item?.title != null ? String(item.title) : '',
    desc: item?.desc != null ? String(item.desc) : '',
  }))
}

function asStats(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    label: item?.label != null ? String(item.label) : '',
    value: item?.value != null ? String(item.value) : '',
    sub: item?.sub != null ? String(item.sub) : '',
  }))
}

function asPoints(list) {
  if (!Array.isArray(list)) return []
  return list.map((p) => (p != null ? String(p) : ''))
}

function emptyContent() {
  return {
    hero: { tag: '', title: '', description: '' },
    grid: { tag: '', title: '', subtitle: '' },
    profile_pillars: { tag: '', title: '', subtitle: '', items: [] },
    process: { tag: '', title: '', subtitle: '', steps: [] },
    why: { tag: '', title: '', subtitle: '', cta: '', points: [], stats: [] },
  }
}

function syncListLengths(enList, arList, emptyItem) {
  const len = Math.max(enList.length, arList.length)
  while (enList.length < len) enList.push(typeof emptyItem === 'function' ? emptyItem() : { ...emptyItem })
  while (arList.length < len) arList.push(typeof emptyItem === 'function' ? emptyItem() : { ...emptyItem })
}

function apiToForm(data) {
  const content = data?.content || {}
  const arContent = data?.translations?.ar?.content || {}
  const en = emptyContent()
  const ar = emptyContent()

  const apply = (target, src) => {
    target.hero = { ...target.hero, ...(src.hero || {}) }
    target.grid = { ...target.grid, ...(src.grid || {}) }
    target.profile_pillars = {
      ...target.profile_pillars,
      ...(src.profile_pillars || {}),
      items: asPillars(src.profile_pillars?.items),
    }
    target.process = {
      ...target.process,
      ...(src.process || {}),
      steps: asSteps(src.process?.steps),
    }
    target.why = {
      ...target.why,
      ...(src.why || {}),
      points: asPoints(src.why?.points),
      stats: asStats(src.why?.stats),
    }
  }

  apply(en, content)
  apply(ar, arContent)

  syncListLengths(en.profile_pillars.items, ar.profile_pillars.items, { title: '', desc: '', tag: '' })
  syncListLengths(en.process.steps, ar.process.steps, () => ({ num: '', title: '', desc: '' }))
  syncListLengths(en.why.points, ar.why.points, '')
  syncListLengths(en.why.stats, ar.why.stats, { label: '', value: '', sub: '' })

  // Align step numbers across locales
  const stepLen = en.process.steps.length
  for (let i = 0; i < stepLen; i++) {
    const num = en.process.steps[i].num || ar.process.steps[i].num || String(i + 1).padStart(2, '0')
    en.process.steps[i].num = num
    ar.process.steps[i].num = num
  }

  return { en, ar }
}

function formToApi(formSection) {
  const s = formSection || emptyContent()
  return {
    hero: {
      tag: s.hero.tag ?? '',
      title: s.hero.title ?? '',
      description: s.hero.description ?? '',
    },
    grid: {
      tag: s.grid.tag ?? '',
      title: s.grid.title ?? '',
      subtitle: s.grid.subtitle ?? '',
    },
    profile_pillars: {
      tag: s.profile_pillars.tag ?? '',
      title: s.profile_pillars.title ?? '',
      subtitle: s.profile_pillars.subtitle ?? '',
      items: asPillars(s.profile_pillars.items),
    },
    process: {
      tag: s.process.tag ?? '',
      title: s.process.title ?? '',
      subtitle: s.process.subtitle ?? '',
      steps: asSteps(s.process.steps),
    },
    why: {
      tag: s.why.tag ?? '',
      title: s.why.title ?? '',
      subtitle: s.why.subtitle ?? '',
      cta: s.why.cta ?? '',
      points: asPoints(s.why.points),
      stats: asStats(s.why.stats),
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

function BilingualObjectList({
  title,
  enItems,
  arItems,
  fields,
  emptyItem,
  onChangeEn,
  onChangeAr,
  readOnly,
  t,
  sharedFields = [],
}) {
  const enList = Array.isArray(enItems) ? enItems : []
  const arList = Array.isArray(arItems) ? arItems : []
  const count = Math.max(enList.length, arList.length)
  const indices = Array.from({ length: count }, (_, i) => i)

  const getEn = (i) => enList[i] || { ...emptyItem }
  const getAr = (i) => arList[i] || { ...emptyItem }

  const updateEn = (index, field, value) => {
    const next = [...enList]
    while (next.length <= index) next.push({ ...emptyItem })
    next[index] = { ...getEn(index), [field]: value }
    onChangeEn(next)
  }

  const updateAr = (index, field, value) => {
    const next = [...arList]
    while (next.length <= index) next.push({ ...emptyItem })
    next[index] = { ...getAr(index), [field]: value }
    onChangeAr(next)
  }

  const updateShared = (index, field, value) => {
    const nextEn = [...enList]
    const nextAr = [...arList]
    while (nextEn.length <= index) nextEn.push({ ...emptyItem })
    while (nextAr.length <= index) nextAr.push({ ...emptyItem })
    nextEn[index] = { ...getEn(index), [field]: value }
    nextAr[index] = { ...getAr(index), [field]: value }
    onChangeEn(nextEn)
    onChangeAr(nextAr)
  }

  const removeAt = (index) => {
    onChangeEn(enList.filter((_, i) => i !== index))
    onChangeAr(arList.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onChangeEn([...enList, { ...emptyItem }])
    onChangeAr([...arList, { ...emptyItem }])
  }

  const localeFields = fields.filter((f) => !sharedFields.includes(f.key))
  const shared = fields.filter((f) => sharedFields.includes(f.key))

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{title}</label>
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
              {shared.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shared.map((f) => (
                    <Field
                      key={`shared-${f.key}`}
                      label={f.label}
                      value={getEn(index)[f.key] || ''}
                      onChange={(v) => updateShared(index, f.key, v)}
                      readOnly={readOnly}
                      multiline={!!f.multiline}
                    />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 p-3 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('pages.english')}</p>
                  {localeFields.map((f) => (
                    <Field
                      key={`en-${f.key}`}
                      label={f.label}
                      value={getEn(index)[f.key] || ''}
                      onChange={(v) => updateEn(index, f.key, v)}
                      readOnly={readOnly}
                      multiline={!!f.multiline}
                    />
                  ))}
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-3" dir="rtl">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500 text-right">{t('pages.arabic')}</p>
                  {localeFields.map((f) => (
                    <Field
                      key={`ar-${f.key}`}
                      label={f.label}
                      value={getAr(index)[f.key] || ''}
                      onChange={(v) => updateAr(index, f.key, v)}
                      readOnly={readOnly}
                      multiline={!!f.multiline}
                      dir="rtl"
                    />
                  ))}
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

function PointsList({ enItems, arItems, onChangeEn, onChangeAr, readOnly, t }) {
  const enList = Array.isArray(enItems) ? enItems : []
  const arList = Array.isArray(arItems) ? arItems : []
  const count = Math.max(enList.length, arList.length)
  const indices = Array.from({ length: count }, (_, i) => i)

  const updateEn = (index, value) => {
    const next = [...enList]
    while (next.length <= index) next.push('')
    next[index] = value
    onChangeEn(next)
  }

  const updateAr = (index, value) => {
    const next = [...arList]
    while (next.length <= index) next.push('')
    next[index] = value
    onChangeAr(next)
  }

  const removeAt = (index) => {
    onChangeEn(enList.filter((_, i) => i !== index))
    onChangeAr(arList.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{t('pages.services_fields.why_points')}</label>
        <span className="text-xs text-gray-400">{t('pages.list_count', { count })}</span>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-3 space-y-3">
        {count === 0 ? (
          <p className="text-xs text-gray-500 py-2 text-center">{t('pages.list_empty')}</p>
        ) : (
          indices.map((index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-700">{t('pages.item_card')} {index + 1}</p>
                {!readOnly && (
                  <button type="button" onClick={() => removeAt(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <FaTrashAlt className="text-sm" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Field label={t('pages.english')} value={enList[index] || ''} onChange={(v) => updateEn(index, v)} readOnly={readOnly} />
                <Field label={t('pages.arabic')} value={arList[index] || ''} onChange={(v) => updateAr(index, v)} readOnly={readOnly} dir="rtl" />
              </div>
            </div>
          ))
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              onChangeEn([...enList, ''])
              onChangeAr([...arList, ''])
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
      case 'hero':
        return [
          ['hero.tag', 'pages.fields.tag'],
          ['hero.title', 'pages.fields.title'],
          ['hero.description', 'pages.fields.description', { multiline: true, rows: 3 }],
        ]
      case 'grid':
        return [
          ['grid.tag', 'pages.fields.tag'],
          ['grid.title', 'pages.fields.title'],
          ['grid.subtitle', 'pages.fields.subtitle', { multiline: true }],
        ]
      case 'profile_pillars':
        return [
          ['profile_pillars.tag', 'pages.fields.tag'],
          ['profile_pillars.title', 'pages.fields.title'],
          ['profile_pillars.subtitle', 'pages.fields.subtitle', { multiline: true }],
        ]
      case 'process':
        return [
          ['process.tag', 'pages.fields.tag'],
          ['process.title', 'pages.fields.title'],
          ['process.subtitle', 'pages.fields.subtitle', { multiline: true }],
        ]
      case 'why':
        return [
          ['why.tag', 'pages.fields.tag'],
          ['why.title', 'pages.fields.title'],
          ['why.subtitle', 'pages.fields.subtitle', { multiline: true }],
          ['why.cta', 'pages.services_fields.cta'],
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

      {sectionKey === 'profile_pillars' && (
        <BilingualObjectList
          title={t('pages.services_fields.pillars_items')}
          enItems={en.profile_pillars.items}
          arItems={ar.profile_pillars.items}
          emptyItem={{ title: '', desc: '', tag: '' }}
          fields={[
            { key: 'title', label: t('pages.fields.item_title') },
            { key: 'desc', label: t('pages.fields.item_desc'), multiline: true },
            { key: 'tag', label: t('pages.fields.tag') },
          ]}
          onChangeEn={(items) => onChangeEn({ ...en, profile_pillars: { ...en.profile_pillars, items } })}
          onChangeAr={(items) => onChangeAr({ ...ar, profile_pillars: { ...ar.profile_pillars, items } })}
          readOnly={readOnly}
          t={t}
        />
      )}

      {sectionKey === 'process' && (
        <BilingualObjectList
          title={t('pages.services_fields.process_steps')}
          enItems={en.process.steps}
          arItems={ar.process.steps}
          emptyItem={{ num: '', title: '', desc: '' }}
          fields={[
            { key: 'num', label: t('pages.services_fields.step_num') },
            { key: 'title', label: t('pages.fields.item_title') },
            { key: 'desc', label: t('pages.fields.item_desc'), multiline: true },
          ]}
          sharedFields={['num']}
          onChangeEn={(steps) => onChangeEn({ ...en, process: { ...en.process, steps } })}
          onChangeAr={(steps) => onChangeAr({ ...ar, process: { ...ar.process, steps } })}
          readOnly={readOnly}
          t={t}
        />
      )}

      {sectionKey === 'why' && (
        <>
          <PointsList
            enItems={en.why.points}
            arItems={ar.why.points}
            onChangeEn={(points) => onChangeEn({ ...en, why: { ...en.why, points } })}
            onChangeAr={(points) => onChangeAr({ ...ar, why: { ...ar.why, points } })}
            readOnly={readOnly}
            t={t}
          />
          <BilingualObjectList
            title={t('pages.services_fields.why_stats')}
            enItems={en.why.stats}
            arItems={ar.why.stats}
            emptyItem={{ label: '', value: '', sub: '' }}
            fields={[
              { key: 'value', label: t('pages.services_fields.stat_value') },
              { key: 'label', label: t('pages.services_fields.stat_label') },
              { key: 'sub', label: t('pages.services_fields.stat_sub') },
            ]}
            sharedFields={['value']}
            onChangeEn={(stats) => onChangeEn({ ...en, why: { ...en.why, stats } })}
            onChangeAr={(stats) => onChangeAr({ ...ar, why: { ...ar.why, stats } })}
            readOnly={readOnly}
            t={t}
          />
        </>
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
  return {
    en: paired.map((p) => p.en),
    ar: paired.map((p) => p.ar),
  }
}

export default function ServicesPageEditor() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState('hero')
  const [form, setForm] = useState(() => ({ en: emptyContent(), ar: emptyContent() }))

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])
  const canView = account?.permissions?.includes('view_pages')
  const canEdit = account?.permissions?.includes('edit_pages')

  const { data: pageRes, isLoading, isError, error } = useQuery({
    queryKey: ['pageContent', 'services'],
    queryFn: () => axios.get(PAGES_API.detail('services'), { headers: authHeaders() }),
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

      const pillars = pairFilter(
        content.profile_pillars.items,
        arContent.profile_pillars.items,
        (enItem, arItem) =>
          !enItem?.title && !enItem?.desc && !enItem?.tag && !arItem?.title && !arItem?.desc && !arItem?.tag
      )
      content.profile_pillars.items = pillars.en
      arContent.profile_pillars.items = pillars.ar

      const steps = pairFilter(
        content.process.steps,
        arContent.process.steps,
        (enItem, arItem) => !enItem?.title && !enItem?.desc && !arItem?.title && !arItem?.desc
      )
      content.process.steps = steps.en.map((s, i) => ({
        ...s,
        num: s.num || steps.ar[i]?.num || String(i + 1).padStart(2, '0'),
      }))
      arContent.process.steps = steps.ar.map((s, i) => ({
        ...s,
        num: content.process.steps[i].num,
      }))

      const points = pairFilter(
        content.why.points,
        arContent.why.points,
        (enItem, arItem) => !(String(enItem || '').trim() || String(arItem || '').trim())
      )
      content.why.points = points.en
      arContent.why.points = points.ar

      const stats = pairFilter(
        content.why.stats,
        arContent.why.stats,
        (enItem, arItem) =>
          !enItem?.label && !enItem?.value && !enItem?.sub && !arItem?.label && !arItem?.value && !arItem?.sub
      )
      content.why.stats = stats.en.map((s, i) => ({
        ...s,
        value: s.value || stats.ar[i]?.value || '',
      }))
      arContent.why.stats = stats.ar.map((s, i) => ({
        ...s,
        value: content.why.stats[i].value,
      }))

      return axios.put(
        PAGES_API.detail('services'),
        { content, translations: { ar: { content: arContent } } },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
      )
    },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 2000 })
      queryClient.invalidateQueries({ queryKey: ['pageContent', 'services'] })
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
        <h1 className="text-3xl font-bold text-gray-800">{t('pages.services_title')}</h1>
        <p className="text-gray-600 text-sm mt-1 max-w-3xl">
          {t('pages.services_subtitle')}{' '}
          <Link to="/services" className="text-primary underline">{t('sidebar.services')}</Link>
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
            {t(`pages.services_sections.${key}`)}
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
