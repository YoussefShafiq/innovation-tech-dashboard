import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave, FaPlus, FaTrashAlt } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { AUTH, PAGES_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'
import PreviewShell from '../PagePreview/PreviewShell.jsx'
import HomePreview from '../PagePreview/HomePreview.jsx'

const SECTIONS = [
  'hero',
  'about_strip',
  'why',
  'partners',
  'fulfillment',
  'services',
  'process',
  'pillars',
  'testimonials',
  'cta',
]

function asStringList(list) {
  if (!Array.isArray(list)) return []
  return list.map((x) => String(x ?? ''))
}

function asObjectList(list, keys, defaults = {}) {
  if (!Array.isArray(list) || list.length === 0) return []
  return list.map((item) => {
    const row = { ...defaults }
    keys.forEach((k) => {
      row[k] = item?.[k] != null ? String(item[k]) : ''
    })
    return row
  })
}

function cleanStringList(list) {
  return (Array.isArray(list) ? list : []).map((x) => String(x ?? '').trim()).filter(Boolean)
}

function cleanObjectList(list, keys) {
  return (Array.isArray(list) ? list : [])
    .map((item) => {
      const row = {}
      keys.forEach((k) => {
        row[k] = String(item?.[k] ?? '').trim()
      })
      return row
    })
    .filter((row) => keys.some((k) => row[k]))
}

function emptyContent() {
  return {
    hero: {
      badge: '',
      badge_secondary: '',
      title_part1: '',
      title_part2: '',
      hero_words: [],
      description: '',
      cta_primary: '',
      cta_secondary: '',
      trust_iso: '',
      trust_uptime: '',
      trust_support: '',
      hero_images: [],
    },
    about_strip: {
      who_tag: '',
      title: '',
      p1: '',
      bullets: [],
      cta: '',
      card_badge: '',
      card_p: '',
    },
    why: { tag: '', title: '', subtitle: '', items: [] },
    partners: { tag: '', title: '', subtitle: '' },
    fulfillment: {
      tag: '',
      title: '',
      p1: '',
      bullets: [],
      cta: '',
      card1_title: '',
      card1_sub: '',
      card2_title: '',
      card2_sub: '',
      footer_note: '',
    },
    services: { tag: '', title: '', subtitle: '', cta: '' },
    process: { tag: '', title: '', subtitle: '', steps: [] },
    pillars: { tag: '', title: '', subtitle: '', items: [], cta: '' },
    testimonials: { tag: '', title: '', subtitle: '', quotes: [] },
    cta: { title: '', description: '', primary: '', secondary: '' },
  }
}

function apiSectionToForm(section, key) {
  const s = section || {}
  switch (key) {
    case 'hero':
      return {
        badge: s.badge ?? '',
        badge_secondary: s.badge_secondary ?? '',
        title_part1: s.title_part1 ?? '',
        title_part2: s.title_part2 ?? '',
        hero_words: asStringList(s.hero_words),
        description: s.description ?? '',
        cta_primary: s.cta_primary ?? '',
        cta_secondary: s.cta_secondary ?? '',
        trust_iso: s.trust?.iso_certified ?? '',
        trust_uptime: s.trust?.uptime_sla ?? '',
        trust_support: s.trust?.support_24 ?? '',
        hero_images: asStringList(s.hero_images),
      }
    case 'about_strip':
      return {
        who_tag: s.who_tag ?? '',
        title: s.title ?? '',
        p1: s.p1 ?? '',
        bullets: asStringList(s.bullets),
        cta: s.cta ?? '',
        card_badge: s.card_badge ?? '',
        card_p: s.card_p ?? '',
      }
    case 'why':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        items: asObjectList(s.items, ['title', 'desc']),
      }
    case 'partners':
    case 'services':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        ...(key === 'services' ? { cta: s.cta ?? '' } : {}),
      }
    case 'fulfillment':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        p1: s.p1 ?? '',
        bullets: asStringList(s.bullets),
        cta: s.cta ?? '',
        card1_title: s.card1_title ?? '',
        card1_sub: s.card1_sub ?? '',
        card2_title: s.card2_title ?? '',
        card2_sub: s.card2_sub ?? '',
        footer_note: s.footer_note ?? '',
      }
    case 'process':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        steps: asObjectList(s.steps, ['n', 'title', 'desc']),
      }
    case 'pillars':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        items: asObjectList(s.items, ['title', 'desc']),
        cta: s.cta ?? '',
      }
    case 'testimonials':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        quotes: asObjectList(s.quotes, ['quote', 'name', 'org']),
      }
    case 'cta':
      return {
        title: s.title ?? '',
        description: s.description ?? '',
        primary: s.primary ?? '',
        secondary: s.secondary ?? '',
      }
    default:
      return {}
  }
}

function formSectionToApi(formSection, key) {
  const s = formSection || {}
  switch (key) {
    case 'hero':
      return {
        badge: s.badge,
        badge_secondary: s.badge_secondary,
        title_part1: s.title_part1,
        title_part2: s.title_part2,
        // Keep raw parallel arrays; saveMutation drops empty word+image pairs together
        hero_words: asStringList(s.hero_words).map((x) => String(x).trim()),
        description: s.description,
        cta_primary: s.cta_primary,
        cta_secondary: s.cta_secondary,
        trust: {
          iso_certified: s.trust_iso,
          uptime_sla: s.trust_uptime,
          support_24: s.trust_support,
        },
        hero_images: asStringList(s.hero_images).map((x) => String(x).trim()),
      }
    case 'about_strip':
      return {
        who_tag: s.who_tag,
        title: s.title,
        p1: s.p1,
        bullets: cleanStringList(s.bullets),
        cta: s.cta,
        card_badge: s.card_badge,
        card_p: s.card_p,
      }
    case 'why':
      return {
        tag: s.tag,
        title: s.title,
        subtitle: s.subtitle,
        items: cleanObjectList(s.items, ['title', 'desc']),
      }
    case 'partners':
      return { tag: s.tag, title: s.title, subtitle: s.subtitle }
    case 'services':
      return { tag: s.tag, title: s.title, subtitle: s.subtitle, cta: s.cta }
    case 'fulfillment':
      return {
        tag: s.tag,
        title: s.title,
        p1: s.p1,
        bullets: cleanStringList(s.bullets),
        cta: s.cta,
        card1_title: s.card1_title,
        card1_sub: s.card1_sub,
        card2_title: s.card2_title,
        card2_sub: s.card2_sub,
        footer_note: s.footer_note,
      }
    case 'process':
      return {
        tag: s.tag,
        title: s.title,
        subtitle: s.subtitle,
        steps: cleanObjectList(s.steps, ['n', 'title', 'desc']),
      }
    case 'pillars':
      return {
        tag: s.tag,
        title: s.title,
        subtitle: s.subtitle,
        items: cleanObjectList(s.items, ['title', 'desc']),
        cta: s.cta,
      }
    case 'testimonials':
      return {
        tag: s.tag,
        title: s.title,
        subtitle: s.subtitle,
        quotes: cleanObjectList(s.quotes, ['quote', 'name', 'org']),
      }
    case 'cta':
      return {
        title: s.title,
        description: s.description,
        primary: s.primary,
        secondary: s.secondary,
      }
    default:
      return {}
  }
}

function padStringLists(enList, arList) {
  const en = asStringList(enList)
  const ar = asStringList(arList)
  const len = Math.max(en.length, ar.length)
  while (en.length < len) en.push('')
  while (ar.length < len) ar.push('')
  return { en, ar }
}

function padObjectLists(enList, arList, keys) {
  const en = asObjectList(enList, keys)
  const ar = asObjectList(arList, keys)
  const empty = () => {
    const row = {}
    keys.forEach((k) => {
      row[k] = ''
    })
    return row
  }
  const len = Math.max(en.length, ar.length)
  while (en.length < len) en.push(empty())
  while (ar.length < len) ar.push(empty())
  return { en, ar }
}

function syncSectionLists(enSection, arSection, sectionKey) {
  const en = { ...enSection }
  const ar = { ...arSection }

  if (sectionKey === 'hero') {
    const words = padStringLists(en.hero_words, ar.hero_words)
    const imagesEn = asStringList(en.hero_images)
    const imagesAr = asStringList(ar.hero_images)
    // Prefer EN images; fall back to AR slot if EN empty
    const imageCount = Math.max(imagesEn.length, imagesAr.length, words.en.length, words.ar.length)
    const images = []
    for (let i = 0; i < imageCount; i++) {
      images.push(String(imagesEn[i] || imagesAr[i] || ''))
    }
    while (words.en.length < imageCount) words.en.push('')
    while (words.ar.length < imageCount) words.ar.push('')
    en.hero_words = words.en
    ar.hero_words = words.ar
    en.hero_images = images
    ar.hero_images = [...images]
  }
  if (sectionKey === 'about_strip' || sectionKey === 'fulfillment') {
    const bullets = padStringLists(en.bullets, ar.bullets)
    en.bullets = bullets.en
    ar.bullets = bullets.ar
  }
  if (sectionKey === 'why' || sectionKey === 'pillars') {
    const items = padObjectLists(en.items, ar.items, ['title', 'desc'])
    en.items = items.en
    ar.items = items.ar
  }
  if (sectionKey === 'process') {
    const steps = padObjectLists(en.steps, ar.steps, ['n', 'title', 'desc'])
    en.steps = steps.en
    ar.steps = steps.ar
  }
  if (sectionKey === 'testimonials') {
    const quotes = padObjectLists(en.quotes, ar.quotes, ['quote', 'name', 'org'])
    en.quotes = quotes.en
    ar.quotes = quotes.ar
  }

  return { en, ar }
}

function mapApiToForm(data) {
  const content = data?.content || {}
  const arContent = data?.translations?.ar?.content || {}
  const en = emptyContent()
  const ar = emptyContent()
  SECTIONS.forEach((key) => {
    const synced = syncSectionLists(
      { ...en[key], ...apiSectionToForm(content[key], key) },
      { ...ar[key], ...apiSectionToForm(arContent[key], key) },
      key
    )
    en[key] = synced.en
    ar[key] = synced.ar
  })
  return { en, ar }
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

/** Hero slides — each item pairs a typing word (EN+AR) with one image */
function HeroWordImageList({
  enWords,
  arWords,
  enImages,
  arImages,
  onChangeEnWords,
  onChangeArWords,
  onChangeEnImages,
  onChangeArImages,
  readOnly,
  t,
}) {
  const wordsEn = Array.isArray(enWords) ? enWords : []
  const wordsAr = Array.isArray(arWords) ? arWords : []
  const images = Array.isArray(enImages) && enImages.length
    ? enImages
    : Array.isArray(arImages)
      ? arImages
      : []
  const count = Math.max(wordsEn.length, wordsAr.length, images.length)
  const indices = Array.from({ length: count }, (_, i) => i)

  const setAll = (nextWordsEn, nextWordsAr, nextImages) => {
    onChangeEnWords(nextWordsEn)
    onChangeArWords(nextWordsAr)
    onChangeEnImages(nextImages)
    onChangeArImages([...nextImages])
  }

  const padTo = (list, len, fill = '') => {
    const next = [...list]
    while (next.length < len) next.push(fill)
    return next
  }

  const updateWordEn = (index, value) => {
    const nextEn = padTo(wordsEn, count)
    const nextAr = padTo(wordsAr, count)
    const nextImages = padTo(images, count)
    nextEn[index] = value
    setAll(nextEn, nextAr, nextImages)
  }

  const updateWordAr = (index, value) => {
    const nextEn = padTo(wordsEn, count)
    const nextAr = padTo(wordsAr, count)
    const nextImages = padTo(images, count)
    nextAr[index] = value
    setAll(nextEn, nextAr, nextImages)
  }

  const updateImage = (index, value) => {
    const nextEn = padTo(wordsEn, count)
    const nextAr = padTo(wordsAr, count)
    const nextImages = padTo(images, count)
    nextImages[index] = value
    setAll(nextEn, nextAr, nextImages)
  }

  const removeAt = (index) => {
    setAll(
      wordsEn.filter((_, i) => i !== index),
      wordsAr.filter((_, i) => i !== index),
      images.filter((_, i) => i !== index)
    )
  }

  const addItem = () => {
    setAll([...padTo(wordsEn, count), ''], [...padTo(wordsAr, count), ''], [...padTo(images, count), ''])
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{t('pages.fields.hero_slides')}</label>
        <span className="text-xs text-gray-400">{t('pages.list_count', { count })}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{t('pages.hints.hero_slides')}</p>
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
                    {t('pages.item_slide')} {index + 1}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    title={t('pages.remove_item')}
                    aria-label={t('pages.remove_item')}
                  >
                    <FaTrashAlt className="text-sm" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    {t('pages.fields.hero_word')} · {t('pages.english')}
                  </label>
                  <input
                    type="text"
                    value={wordsEn[index] ?? ''}
                    onChange={(e) => updateWordEn(index, e.target.value)}
                    placeholder={t('pages.placeholders.word')}
                    className={`w-full px-3 py-2 border rounded-md ${readOnly ? 'bg-gray-50' : ''}`}
                    readOnly={readOnly}
                  />
                </div>
                <div dir="rtl" className="text-right">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-blue-500 mb-1">
                    {t('pages.fields.hero_word')} · {t('pages.arabic')}
                  </label>
                  <input
                    type="text"
                    value={wordsAr[index] ?? ''}
                    onChange={(e) => updateWordAr(index, e.target.value)}
                    placeholder={t('pages.placeholders.word')}
                    className={`w-full px-3 py-2 border rounded-md text-right border-blue-100 ${readOnly ? 'bg-gray-50' : ''}`}
                    readOnly={readOnly}
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  {t('pages.fields.hero_image')}
                </label>
                <input
                  type="text"
                  value={images[index] ?? ''}
                  onChange={(e) => updateImage(index, e.target.value)}
                  placeholder={t('pages.placeholders.image_url')}
                  className={`w-full px-3 py-2 border rounded-md ${readOnly ? 'bg-gray-50' : ''}`}
                  readOnly={readOnly}
                  dir="ltr"
                />
                {(images[index] || '').trim() ? (
                  <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 max-w-xs">
                    <img
                      src={images[index]}
                      alt=""
                      className="h-28 w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={addItem}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-primary/30 text-primary bg-white hover:bg-primary/5 text-sm font-medium transition-colors"
          >
            <FaPlus className="text-xs" />
            {t('pages.add_item')}
          </button>
        )}
      </div>
    </div>
  )
}

/** Bilingual string list — each item has EN + AR inputs; add/remove applies to both */
function BilingualStringList({
  label,
  enValues,
  arValues,
  onChangeEn,
  onChangeAr,
  readOnly,
  t,
  placeholder,
  itemLabel,
  sharedValue = false,
}) {
  const enList = Array.isArray(enValues) ? enValues : []
  const arList = Array.isArray(arValues) ? arValues : []
  const count = Math.max(enList.length, arList.length)
  const indices = Array.from({ length: count }, (_, i) => i)

  const updateEn = (index, value) => {
    const next = [...enList]
    while (next.length <= index) next.push('')
    next[index] = value
    onChangeEn(next)
    if (sharedValue) {
      const nextAr = [...arList]
      while (nextAr.length <= index) nextAr.push('')
      nextAr[index] = value
      onChangeAr(nextAr)
    }
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

  const addItem = () => {
    onChangeEn([...enList, ''])
    onChangeAr([...arList, ''])
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-400">{t('pages.list_count', { count })}</span>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-3 space-y-3">
        {count === 0 ? (
          <p className="text-xs text-gray-500 py-2 text-center">{t('pages.list_empty')}</p>
        ) : (
          indices.map((index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-gray-700">
                    {itemLabel} {index + 1}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    title={t('pages.remove_item')}
                    aria-label={t('pages.remove_item')}
                  >
                    <FaTrashAlt className="text-sm" />
                  </button>
                )}
              </div>
              {sharedValue ? (
                <input
                  type="text"
                  value={enList[index] ?? ''}
                  onChange={(e) => updateEn(index, e.target.value)}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2 border rounded-md ${readOnly ? 'bg-gray-50' : ''}`}
                  readOnly={readOnly}
                  dir="ltr"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      {t('pages.english')}
                    </label>
                    <input
                      type="text"
                      value={enList[index] ?? ''}
                      onChange={(e) => updateEn(index, e.target.value)}
                      placeholder={placeholder}
                      className={`w-full px-3 py-2 border rounded-md ${readOnly ? 'bg-gray-50' : ''}`}
                      readOnly={readOnly}
                    />
                  </div>
                  <div dir="rtl" className="text-right">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-blue-500 mb-1">
                      {t('pages.arabic')}
                    </label>
                    <input
                      type="text"
                      value={arList[index] ?? ''}
                      onChange={(e) => updateAr(index, e.target.value)}
                      placeholder={placeholder}
                      className={`w-full px-3 py-2 border rounded-md text-right border-blue-100 ${readOnly ? 'bg-gray-50' : ''}`}
                      readOnly={readOnly}
                      dir="rtl"
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={addItem}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-primary/30 text-primary bg-white hover:bg-primary/5 text-sm font-medium transition-colors"
          >
            <FaPlus className="text-xs" />
            {t('pages.add_item')}
          </button>
        )}
      </div>
    </div>
  )
}

/** Bilingual object list — each item card has EN + AR field groups */
function BilingualObjectList({
  label,
  enValues,
  arValues,
  onChangeEn,
  onChangeAr,
  readOnly,
  t,
  fields,
  emptyItem,
  itemLabel,
}) {
  const enList = Array.isArray(enValues) ? enValues : []
  const arList = Array.isArray(arValues) ? arValues : []
  const count = Math.max(enList.length, arList.length)
  const indices = Array.from({ length: count }, (_, i) => i)

  const getEn = (index) => enList[index] || emptyItem
  const getAr = (index) => arList[index] || emptyItem

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

  const removeAt = (index) => {
    onChangeEn(enList.filter((_, i) => i !== index))
    onChangeAr(arList.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onChangeEn([...enList, { ...emptyItem }])
    onChangeAr([...arList, { ...emptyItem }])
  }

  const inputCls = (ro, rtl = false) =>
    `w-full px-3 py-2 border rounded-md ${rtl ? 'text-right border-blue-100' : ''} ${ro ? 'bg-gray-50' : ''}`

  const renderFields = (item, onFieldChange, dir) => (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.key} className={dir === 'rtl' ? 'text-right' : ''}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
          {f.multiline ? (
            <textarea
              rows={f.rows || 3}
              value={item[f.key] ?? ''}
              onChange={(e) => onFieldChange(f.key, e.target.value)}
              className={inputCls(readOnly, dir === 'rtl')}
              readOnly={readOnly}
              dir={dir}
              placeholder={f.placeholder}
            />
          ) : (
            <input
              type="text"
              value={item[f.key] ?? ''}
              onChange={(e) => onFieldChange(f.key, e.target.value)}
              className={inputCls(readOnly, dir === 'rtl')}
              readOnly={readOnly}
              dir={dir}
              placeholder={f.placeholder}
            />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
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
                    {itemLabel} {index + 1}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    title={t('pages.remove_item')}
                    aria-label={t('pages.remove_item')}
                  >
                    <FaTrashAlt className="text-sm" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 p-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('pages.english')}</p>
                  {renderFields(getEn(index), (field, value) => updateEn(index, field, value))}
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-2" dir="rtl">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500 text-right">{t('pages.arabic')}</p>
                  {renderFields(getAr(index), (field, value) => updateAr(index, field, value), 'rtl')}
                </div>
              </div>
            </div>
          ))
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={addItem}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-primary/30 text-primary bg-white hover:bg-primary/5 text-sm font-medium transition-colors"
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
  const setEn = (field, value) => onChangeEn({ ...en, [field]: value })
  const setAr = (field, value) => onChangeAr({ ...ar, [field]: value })

  const simpleFields = {
    partners: ['tag', 'title', 'subtitle'],
    services: ['tag', 'title', 'subtitle', 'cta'],
    cta: ['title', 'description', 'primary', 'secondary'],
  }

  const whyItemFields = [
    { key: 'title', label: t('pages.fields.item_title') },
    { key: 'desc', label: t('pages.fields.item_desc'), multiline: true, rows: 3 },
  ]
  const stepFields = [
    { key: 'n', label: t('pages.fields.step_number'), placeholder: '01' },
    { key: 'title', label: t('pages.fields.item_title') },
    { key: 'desc', label: t('pages.fields.item_desc'), multiline: true, rows: 3 },
  ]
  const quoteFields = [
    { key: 'quote', label: t('pages.fields.quote_text'), multiline: true, rows: 3 },
    { key: 'name', label: t('pages.fields.quote_name') },
    { key: 'org', label: t('pages.fields.quote_org') },
  ]

  const scalarFieldPairs = (() => {
    switch (sectionKey) {
      case 'hero':
        return [
          ['badge', 'pages.fields.badge'],
          ['badge_secondary', 'pages.fields.badge_secondary'],
          ['title_part1', 'pages.fields.title_part1'],
          ['title_part2', 'pages.fields.title_part2'],
          ['description', 'pages.fields.description', { multiline: true, rows: 5 }],
          ['cta_primary', 'pages.fields.cta_primary'],
          ['cta_secondary', 'pages.fields.cta_secondary'],
          ['trust_iso', 'pages.fields.trust_iso'],
          ['trust_uptime', 'pages.fields.trust_uptime'],
          ['trust_support', 'pages.fields.trust_support'],
        ]
      case 'about_strip':
        return [
          ['who_tag', 'pages.fields.tag'],
          ['title', 'pages.fields.title'],
          ['p1', 'pages.fields.body', { multiline: true, rows: 4 }],
          ['cta', 'pages.fields.cta'],
          ['card_badge', 'pages.fields.card_badge'],
          ['card_p', 'pages.fields.card_body', { multiline: true }],
        ]
      case 'why':
      case 'process':
      case 'testimonials':
        return [
          ['tag', 'pages.fields.tag'],
          ['title', 'pages.fields.title'],
          ['subtitle', 'pages.fields.subtitle', { multiline: true }],
        ]
      case 'pillars':
        return [
          ['tag', 'pages.fields.tag'],
          ['title', 'pages.fields.title'],
          ['subtitle', 'pages.fields.subtitle', { multiline: true }],
          ['cta', 'pages.fields.cta'],
        ]
      case 'fulfillment':
        return [
          ['tag', 'pages.fields.tag'],
          ['title', 'pages.fields.title'],
          ['p1', 'pages.fields.body', { multiline: true, rows: 4 }],
          ['cta', 'pages.fields.cta'],
          ['card1_title', 'pages.fields.card1_title'],
          ['card1_sub', 'pages.fields.card1_sub'],
          ['card2_title', 'pages.fields.card2_title'],
          ['card2_sub', 'pages.fields.card2_sub'],
          ['footer_note', 'pages.fields.footer_note'],
        ]
      case 'partners':
      case 'services':
        return (simpleFields[sectionKey] || []).map((field) => [
          field,
          `pages.fields.${field === 'cta' ? 'cta' : field}`,
          field === 'subtitle' ? { multiline: true } : undefined,
        ])
      case 'cta':
        return simpleFields.cta.map((field) => [
          field,
          `pages.fields.${
            field === 'description'
              ? 'description'
              : field === 'primary'
                ? 'cta_primary'
                : field === 'secondary'
                  ? 'cta_secondary'
                  : field
          }`,
          field === 'description' ? { multiline: true } : undefined,
        ])
      default:
        return []
    }
  })()

  const listEditors = (() => {
    switch (sectionKey) {
      case 'hero':
        return (
          <HeroWordImageList
            enWords={en.hero_words}
            arWords={ar.hero_words}
            enImages={en.hero_images}
            arImages={ar.hero_images}
            onChangeEnWords={(v) => setEn('hero_words', v)}
            onChangeArWords={(v) => setAr('hero_words', v)}
            onChangeEnImages={(v) => setEn('hero_images', v)}
            onChangeArImages={(v) => setAr('hero_images', v)}
            readOnly={readOnly}
            t={t}
          />
        )
      case 'about_strip':
      case 'fulfillment':
        return (
          <BilingualStringList
            label={t('pages.fields.bullets')}
            enValues={en.bullets}
            arValues={ar.bullets}
            onChangeEn={(v) => setEn('bullets', v)}
            onChangeAr={(v) => setAr('bullets', v)}
            readOnly={readOnly}
            t={t}
            itemLabel={t('pages.item_bullet')}
            placeholder={t('pages.placeholders.bullet')}
          />
        )
      case 'why':
      case 'pillars':
        return (
          <BilingualObjectList
            label={t('pages.fields.items')}
            enValues={en.items}
            arValues={ar.items}
            onChangeEn={(v) => setEn('items', v)}
            onChangeAr={(v) => setAr('items', v)}
            readOnly={readOnly}
            t={t}
            fields={whyItemFields}
            emptyItem={{ title: '', desc: '' }}
            itemLabel={t('pages.item_card')}
          />
        )
      case 'process':
        return (
          <BilingualObjectList
            label={t('pages.fields.steps')}
            enValues={en.steps}
            arValues={ar.steps}
            onChangeEn={(v) => setEn('steps', v)}
            onChangeAr={(v) => setAr('steps', v)}
            readOnly={readOnly}
            t={t}
            fields={stepFields}
            emptyItem={{ n: '', title: '', desc: '' }}
            itemLabel={t('pages.item_step')}
          />
        )
      case 'testimonials':
        return (
          <BilingualObjectList
            label={t('pages.fields.quotes')}
            enValues={en.quotes}
            arValues={ar.quotes}
            onChangeEn={(v) => setEn('quotes', v)}
            onChangeAr={(v) => setAr('quotes', v)}
            readOnly={readOnly}
            t={t}
            fields={quoteFields}
            emptyItem={{ quote: '', name: '', org: '' }}
            itemLabel={t('pages.item_quote')}
          />
        )
      default:
        return null
    }
  })()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 border rounded-xl p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('pages.english')}</h3>
          {scalarFieldPairs.map(([field, labelKey, opts]) => (
            <Field
              key={`en-${field}`}
              label={t(labelKey)}
              value={en[field] ?? ''}
              onChange={(v) => setEn(field, v)}
              readOnly={readOnly}
              multiline={!!opts?.multiline}
              rows={opts?.rows || 3}
            />
          ))}
        </div>
        <div className="space-y-4 border rounded-xl p-4 border-blue-100 bg-blue-50/40" dir="rtl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500">{t('pages.arabic')}</h3>
          {scalarFieldPairs.map(([field, labelKey, opts]) => (
            <Field
              key={`ar-${field}`}
              label={t(labelKey)}
              value={ar[field] ?? ''}
              onChange={(v) => setAr(field, v)}
              readOnly={readOnly}
              multiline={!!opts?.multiline}
              rows={opts?.rows || 3}
              dir="rtl"
            />
          ))}
        </div>
      </div>

      {listEditors ? <div className="space-y-6">{listEditors}</div> : null}
    </div>
  )
}

export default function HomePageEditor() {
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

  const {
    data: pageRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['pageContent', 'home'],
    queryFn: () => axios.get(PAGES_API.detail('home'), { headers: authHeaders() }),
    enabled: !profileLoading && !!canView,
  })

  useEffect(() => {
    const d = pageRes?.data?.data
    if (d) setForm(mapApiToForm(d))
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
      const content = {}
      const arContent = {}
      SECTIONS.forEach((key) => {
        content[key] = formSectionToApi(form.en[key], key)
        arContent[key] = formSectionToApi(form.ar[key], key)
      })

      // Keep hero word ↔ image pairs aligned (drop fully empty slides)
      if (content.hero && arContent.hero) {
        const wordsEn = asStringList(content.hero.hero_words)
        const wordsAr = asStringList(arContent.hero.hero_words)
        const images = asStringList(content.hero.hero_images)
        const n = Math.max(wordsEn.length, wordsAr.length, images.length)
        const nextWordsEn = []
        const nextWordsAr = []
        const nextImages = []
        for (let i = 0; i < n; i++) {
          const wEn = String(wordsEn[i] ?? '').trim()
          const wAr = String(wordsAr[i] ?? '').trim()
          const img = String(images[i] ?? content.hero.hero_images?.[i] ?? arContent.hero.hero_images?.[i] ?? '').trim()
          if (!wEn && !wAr && !img) continue
          nextWordsEn.push(wEn)
          nextWordsAr.push(wAr)
          nextImages.push(img)
        }
        content.hero.hero_words = nextWordsEn
        content.hero.hero_images = nextImages
        arContent.hero.hero_words = nextWordsAr
        arContent.hero.hero_images = [...nextImages]
      }

      return axios.put(
        PAGES_API.detail('home'),
        {
          content,
          translations: { ar: { content: arContent } },
        },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
      )
    },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 2000 })
      queryClient.invalidateQueries({ queryKey: ['pageContent', 'home'] })
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
        <h1 className="text-3xl font-bold text-gray-800">{t('pages.home_title')}</h1>
        <p className="text-gray-600 text-sm mt-1 max-w-2xl">{t('pages.home_subtitle')}</p>
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
            {t(`pages.sections.${key}`)}
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
              en={form.en[activeSection]}
              ar={form.ar[activeSection]}
              onChangeEn={(next) =>
                setForm((prev) => ({ ...prev, en: { ...prev.en, [activeSection]: next } }))
              }
              onChangeAr={(next) =>
                setForm((prev) => ({ ...prev, ar: { ...prev.ar, [activeSection]: next } }))
              }
              readOnly={!canEdit}
              t={t}
            />
          )}
        </div>

        <PreviewShell
          title={t(`pages.sections.${activeSection}`)}
          previewLocale={previewLocale}
          onPreviewLocaleChange={setPreviewLocale}
        >
          <HomePreview content={form[previewLocale]} activeSection={activeSection} />
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
