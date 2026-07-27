import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { AUTH, PAGES_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

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

function linesToList(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function listToLines(list) {
  if (!Array.isArray(list)) return ''
  return list.map((x) => String(x ?? '').trim()).filter(Boolean).join('\n')
}

function itemsToText(items, keys = ['title', 'desc']) {
  if (!Array.isArray(items)) return ''
  return items
    .map((item) => keys.map((k) => String(item?.[k] ?? '').trim()).join(' | '))
    .join('\n')
}

function textToItems(text, keys = ['title', 'desc']) {
  return linesToList(text).map((line) => {
    const parts = line.split('|').map((p) => p.trim())
    const obj = {}
    keys.forEach((k, i) => {
      obj[k] = parts[i] ?? ''
    })
    return obj
  })
}

function quotesToText(quotes) {
  if (!Array.isArray(quotes)) return ''
  return quotes
    .map((q) => [q?.quote, q?.name, q?.org].map((x) => String(x ?? '').trim()).join(' | '))
    .join('\n')
}

function textToQuotes(text) {
  return linesToList(text).map((line) => {
    const [quote = '', name = '', org = ''] = line.split('|').map((p) => p.trim())
    return { quote, name, org }
  })
}

function stepsToText(steps) {
  if (!Array.isArray(steps)) return ''
  return steps
    .map((s) => [s?.n, s?.title, s?.desc].map((x) => String(x ?? '').trim()).join(' | '))
    .join('\n')
}

function textToSteps(text) {
  return linesToList(text).map((line) => {
    const [n = '', title = '', desc = ''] = line.split('|').map((p) => p.trim())
    return { n, title, desc }
  })
}

function emptyContent() {
  return {
    hero: {
      badge: '',
      badge_secondary: '',
      title_part1: '',
      title_part2: '',
      hero_words_text: '',
      description: '',
      cta_primary: '',
      cta_secondary: '',
      trust_iso: '',
      trust_uptime: '',
      trust_support: '',
      hero_images_text: '',
    },
    about_strip: {
      who_tag: '',
      title: '',
      p1: '',
      bullets_text: '',
      cta: '',
      card_badge: '',
      card_p: '',
    },
    why: { tag: '', title: '', subtitle: '', items_text: '' },
    partners: { tag: '', title: '', subtitle: '' },
    fulfillment: {
      tag: '',
      title: '',
      p1: '',
      bullets_text: '',
      cta: '',
      card1_title: '',
      card1_sub: '',
      card2_title: '',
      card2_sub: '',
      footer_note: '',
    },
    services: { tag: '', title: '', subtitle: '', cta: '' },
    process: { tag: '', title: '', subtitle: '', steps_text: '' },
    pillars: { tag: '', title: '', subtitle: '', items_text: '', cta: '' },
    testimonials: { tag: '', title: '', subtitle: '', quotes_text: '' },
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
        hero_words_text: listToLines(s.hero_words),
        description: s.description ?? '',
        cta_primary: s.cta_primary ?? '',
        cta_secondary: s.cta_secondary ?? '',
        trust_iso: s.trust?.iso_certified ?? '',
        trust_uptime: s.trust?.uptime_sla ?? '',
        trust_support: s.trust?.support_24 ?? '',
        hero_images_text: listToLines(s.hero_images),
      }
    case 'about_strip':
      return {
        who_tag: s.who_tag ?? '',
        title: s.title ?? '',
        p1: s.p1 ?? '',
        bullets_text: listToLines(s.bullets),
        cta: s.cta ?? '',
        card_badge: s.card_badge ?? '',
        card_p: s.card_p ?? '',
      }
    case 'why':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        items_text: itemsToText(s.items),
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
        bullets_text: listToLines(s.bullets),
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
        steps_text: stepsToText(s.steps),
      }
    case 'pillars':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        items_text: itemsToText(s.items),
        cta: s.cta ?? '',
      }
    case 'testimonials':
      return {
        tag: s.tag ?? '',
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        quotes_text: quotesToText(s.quotes),
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
        hero_words: linesToList(s.hero_words_text),
        description: s.description,
        cta_primary: s.cta_primary,
        cta_secondary: s.cta_secondary,
        trust: {
          iso_certified: s.trust_iso,
          uptime_sla: s.trust_uptime,
          support_24: s.trust_support,
        },
        hero_images: linesToList(s.hero_images_text),
      }
    case 'about_strip':
      return {
        who_tag: s.who_tag,
        title: s.title,
        p1: s.p1,
        bullets: linesToList(s.bullets_text),
        cta: s.cta,
        card_badge: s.card_badge,
        card_p: s.card_p,
      }
    case 'why':
      return {
        tag: s.tag,
        title: s.title,
        subtitle: s.subtitle,
        items: textToItems(s.items_text),
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
        bullets: linesToList(s.bullets_text),
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
        steps: textToSteps(s.steps_text),
      }
    case 'pillars':
      return {
        tag: s.tag,
        title: s.title,
        subtitle: s.subtitle,
        items: textToItems(s.items_text),
        cta: s.cta,
      }
    case 'testimonials':
      return {
        tag: s.tag,
        title: s.title,
        subtitle: s.subtitle,
        quotes: textToQuotes(s.quotes_text),
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

function mapApiToForm(data) {
  const content = data?.content || {}
  const arContent = data?.translations?.ar?.content || {}
  const en = emptyContent()
  const ar = emptyContent()
  SECTIONS.forEach((key) => {
    en[key] = { ...en[key], ...apiSectionToForm(content[key], key) }
    ar[key] = { ...ar[key], ...apiSectionToForm(arContent[key], key) }
  })
  return { en, ar }
}

function Field({ label, value, onChange, readOnly, multiline = false, rows = 3, dir, hint }) {
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
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4 border rounded-xl p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('pages.english')}</h3>
        {sectionKey === 'hero' && (
          <>
            <Field label={t('pages.fields.badge')} value={en.badge} onChange={(v) => setEn('badge', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.badge_secondary')} value={en.badge_secondary} onChange={(v) => setEn('badge_secondary', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.title_part1')} value={en.title_part1} onChange={(v) => setEn('title_part1', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.title_part2')} value={en.title_part2} onChange={(v) => setEn('title_part2', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.hero_words')} value={en.hero_words_text} onChange={(v) => setEn('hero_words_text', v)} readOnly={readOnly} multiline hint={t('pages.hints.one_per_line')} />
            <Field label={t('pages.fields.description')} value={en.description} onChange={(v) => setEn('description', v)} readOnly={readOnly} multiline rows={5} />
            <Field label={t('pages.fields.cta_primary')} value={en.cta_primary} onChange={(v) => setEn('cta_primary', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.cta_secondary')} value={en.cta_secondary} onChange={(v) => setEn('cta_secondary', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.trust_iso')} value={en.trust_iso} onChange={(v) => setEn('trust_iso', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.trust_uptime')} value={en.trust_uptime} onChange={(v) => setEn('trust_uptime', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.trust_support')} value={en.trust_support} onChange={(v) => setEn('trust_support', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.hero_images')} value={en.hero_images_text} onChange={(v) => setEn('hero_images_text', v)} readOnly={readOnly} multiline rows={6} hint={t('pages.hints.image_urls')} />
          </>
        )}
        {sectionKey === 'about_strip' && (
          <>
            <Field label={t('pages.fields.tag')} value={en.who_tag} onChange={(v) => setEn('who_tag', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.title')} value={en.title} onChange={(v) => setEn('title', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.body')} value={en.p1} onChange={(v) => setEn('p1', v)} readOnly={readOnly} multiline rows={4} />
            <Field label={t('pages.fields.bullets')} value={en.bullets_text} onChange={(v) => setEn('bullets_text', v)} readOnly={readOnly} multiline hint={t('pages.hints.one_per_line')} />
            <Field label={t('pages.fields.cta')} value={en.cta} onChange={(v) => setEn('cta', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.card_badge')} value={en.card_badge} onChange={(v) => setEn('card_badge', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.card_body')} value={en.card_p} onChange={(v) => setEn('card_p', v)} readOnly={readOnly} multiline />
          </>
        )}
        {sectionKey === 'why' && (
          <>
            <Field label={t('pages.fields.tag')} value={en.tag} onChange={(v) => setEn('tag', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.title')} value={en.title} onChange={(v) => setEn('title', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.subtitle')} value={en.subtitle} onChange={(v) => setEn('subtitle', v)} readOnly={readOnly} multiline />
            <Field label={t('pages.fields.items')} value={en.items_text} onChange={(v) => setEn('items_text', v)} readOnly={readOnly} multiline rows={8} hint={t('pages.hints.title_desc')} />
          </>
        )}
        {(sectionKey === 'partners' || sectionKey === 'services') &&
          (simpleFields[sectionKey] || []).map((field) => (
            <Field
              key={field}
              label={t(`pages.fields.${field === 'cta' ? 'cta' : field}`)}
              value={en[field] ?? ''}
              onChange={(v) => setEn(field, v)}
              readOnly={readOnly}
              multiline={field === 'subtitle'}
            />
          ))}
        {sectionKey === 'fulfillment' && (
          <>
            <Field label={t('pages.fields.tag')} value={en.tag} onChange={(v) => setEn('tag', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.title')} value={en.title} onChange={(v) => setEn('title', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.body')} value={en.p1} onChange={(v) => setEn('p1', v)} readOnly={readOnly} multiline rows={4} />
            <Field label={t('pages.fields.bullets')} value={en.bullets_text} onChange={(v) => setEn('bullets_text', v)} readOnly={readOnly} multiline hint={t('pages.hints.one_per_line')} />
            <Field label={t('pages.fields.cta')} value={en.cta} onChange={(v) => setEn('cta', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.card1_title')} value={en.card1_title} onChange={(v) => setEn('card1_title', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.card1_sub')} value={en.card1_sub} onChange={(v) => setEn('card1_sub', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.card2_title')} value={en.card2_title} onChange={(v) => setEn('card2_title', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.card2_sub')} value={en.card2_sub} onChange={(v) => setEn('card2_sub', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.footer_note')} value={en.footer_note} onChange={(v) => setEn('footer_note', v)} readOnly={readOnly} />
          </>
        )}
        {sectionKey === 'process' && (
          <>
            <Field label={t('pages.fields.tag')} value={en.tag} onChange={(v) => setEn('tag', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.title')} value={en.title} onChange={(v) => setEn('title', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.subtitle')} value={en.subtitle} onChange={(v) => setEn('subtitle', v)} readOnly={readOnly} multiline />
            <Field label={t('pages.fields.steps')} value={en.steps_text} onChange={(v) => setEn('steps_text', v)} readOnly={readOnly} multiline rows={8} hint={t('pages.hints.steps')} />
          </>
        )}
        {sectionKey === 'pillars' && (
          <>
            <Field label={t('pages.fields.tag')} value={en.tag} onChange={(v) => setEn('tag', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.title')} value={en.title} onChange={(v) => setEn('title', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.subtitle')} value={en.subtitle} onChange={(v) => setEn('subtitle', v)} readOnly={readOnly} multiline />
            <Field label={t('pages.fields.items')} value={en.items_text} onChange={(v) => setEn('items_text', v)} readOnly={readOnly} multiline rows={8} hint={t('pages.hints.title_desc')} />
            <Field label={t('pages.fields.cta')} value={en.cta} onChange={(v) => setEn('cta', v)} readOnly={readOnly} />
          </>
        )}
        {sectionKey === 'testimonials' && (
          <>
            <Field label={t('pages.fields.tag')} value={en.tag} onChange={(v) => setEn('tag', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.title')} value={en.title} onChange={(v) => setEn('title', v)} readOnly={readOnly} />
            <Field label={t('pages.fields.subtitle')} value={en.subtitle} onChange={(v) => setEn('subtitle', v)} readOnly={readOnly} multiline />
            <Field label={t('pages.fields.quotes')} value={en.quotes_text} onChange={(v) => setEn('quotes_text', v)} readOnly={readOnly} multiline rows={8} hint={t('pages.hints.quotes')} />
          </>
        )}
        {sectionKey === 'cta' &&
          simpleFields.cta.map((field) => (
            <Field
              key={field}
              label={t(`pages.fields.${field === 'description' ? 'description' : field === 'primary' ? 'cta_primary' : field === 'secondary' ? 'cta_secondary' : field}`)}
              value={en[field] ?? ''}
              onChange={(v) => setEn(field, v)}
              readOnly={readOnly}
              multiline={field === 'description'}
            />
          ))}
      </div>

      <div className="space-y-4 border rounded-xl p-4 border-blue-100 bg-blue-50/40" dir="rtl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500">{t('pages.arabic')}</h3>
        {sectionKey === 'hero' && (
          <>
            <Field label={t('pages.fields.badge')} value={ar.badge} onChange={(v) => setAr('badge', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.badge_secondary')} value={ar.badge_secondary} onChange={(v) => setAr('badge_secondary', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.title_part1')} value={ar.title_part1} onChange={(v) => setAr('title_part1', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.title_part2')} value={ar.title_part2} onChange={(v) => setAr('title_part2', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.hero_words')} value={ar.hero_words_text} onChange={(v) => setAr('hero_words_text', v)} readOnly={readOnly} multiline dir="rtl" hint={t('pages.hints.one_per_line')} />
            <Field label={t('pages.fields.description')} value={ar.description} onChange={(v) => setAr('description', v)} readOnly={readOnly} multiline rows={5} dir="rtl" />
            <Field label={t('pages.fields.cta_primary')} value={ar.cta_primary} onChange={(v) => setAr('cta_primary', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.cta_secondary')} value={ar.cta_secondary} onChange={(v) => setAr('cta_secondary', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.trust_iso')} value={ar.trust_iso} onChange={(v) => setAr('trust_iso', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.trust_uptime')} value={ar.trust_uptime} onChange={(v) => setAr('trust_uptime', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.trust_support')} value={ar.trust_support} onChange={(v) => setAr('trust_support', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.hero_images')} value={ar.hero_images_text} onChange={(v) => setAr('hero_images_text', v)} readOnly={readOnly} multiline rows={6} dir="ltr" hint={t('pages.hints.image_urls')} />
          </>
        )}
        {sectionKey === 'about_strip' && (
          <>
            <Field label={t('pages.fields.tag')} value={ar.who_tag} onChange={(v) => setAr('who_tag', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.title')} value={ar.title} onChange={(v) => setAr('title', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.body')} value={ar.p1} onChange={(v) => setAr('p1', v)} readOnly={readOnly} multiline rows={4} dir="rtl" />
            <Field label={t('pages.fields.bullets')} value={ar.bullets_text} onChange={(v) => setAr('bullets_text', v)} readOnly={readOnly} multiline dir="rtl" hint={t('pages.hints.one_per_line')} />
            <Field label={t('pages.fields.cta')} value={ar.cta} onChange={(v) => setAr('cta', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.card_badge')} value={ar.card_badge} onChange={(v) => setAr('card_badge', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.card_body')} value={ar.card_p} onChange={(v) => setAr('card_p', v)} readOnly={readOnly} multiline dir="rtl" />
          </>
        )}
        {sectionKey === 'why' && (
          <>
            <Field label={t('pages.fields.tag')} value={ar.tag} onChange={(v) => setAr('tag', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.title')} value={ar.title} onChange={(v) => setAr('title', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.subtitle')} value={ar.subtitle} onChange={(v) => setAr('subtitle', v)} readOnly={readOnly} multiline dir="rtl" />
            <Field label={t('pages.fields.items')} value={ar.items_text} onChange={(v) => setAr('items_text', v)} readOnly={readOnly} multiline rows={8} dir="rtl" hint={t('pages.hints.title_desc')} />
          </>
        )}
        {(sectionKey === 'partners' || sectionKey === 'services') &&
          (simpleFields[sectionKey] || []).map((field) => (
            <Field
              key={field}
              label={t(`pages.fields.${field === 'cta' ? 'cta' : field}`)}
              value={ar[field] ?? ''}
              onChange={(v) => setAr(field, v)}
              readOnly={readOnly}
              multiline={field === 'subtitle'}
              dir="rtl"
            />
          ))}
        {sectionKey === 'fulfillment' && (
          <>
            <Field label={t('pages.fields.tag')} value={ar.tag} onChange={(v) => setAr('tag', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.title')} value={ar.title} onChange={(v) => setAr('title', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.body')} value={ar.p1} onChange={(v) => setAr('p1', v)} readOnly={readOnly} multiline rows={4} dir="rtl" />
            <Field label={t('pages.fields.bullets')} value={ar.bullets_text} onChange={(v) => setAr('bullets_text', v)} readOnly={readOnly} multiline dir="rtl" hint={t('pages.hints.one_per_line')} />
            <Field label={t('pages.fields.cta')} value={ar.cta} onChange={(v) => setAr('cta', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.card1_title')} value={ar.card1_title} onChange={(v) => setAr('card1_title', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.card1_sub')} value={ar.card1_sub} onChange={(v) => setAr('card1_sub', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.card2_title')} value={ar.card2_title} onChange={(v) => setAr('card2_title', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.card2_sub')} value={ar.card2_sub} onChange={(v) => setAr('card2_sub', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.footer_note')} value={ar.footer_note} onChange={(v) => setAr('footer_note', v)} readOnly={readOnly} dir="rtl" />
          </>
        )}
        {sectionKey === 'process' && (
          <>
            <Field label={t('pages.fields.tag')} value={ar.tag} onChange={(v) => setAr('tag', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.title')} value={ar.title} onChange={(v) => setAr('title', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.subtitle')} value={ar.subtitle} onChange={(v) => setAr('subtitle', v)} readOnly={readOnly} multiline dir="rtl" />
            <Field label={t('pages.fields.steps')} value={ar.steps_text} onChange={(v) => setAr('steps_text', v)} readOnly={readOnly} multiline rows={8} dir="rtl" hint={t('pages.hints.steps')} />
          </>
        )}
        {sectionKey === 'pillars' && (
          <>
            <Field label={t('pages.fields.tag')} value={ar.tag} onChange={(v) => setAr('tag', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.title')} value={ar.title} onChange={(v) => setAr('title', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.subtitle')} value={ar.subtitle} onChange={(v) => setAr('subtitle', v)} readOnly={readOnly} multiline dir="rtl" />
            <Field label={t('pages.fields.items')} value={ar.items_text} onChange={(v) => setAr('items_text', v)} readOnly={readOnly} multiline rows={8} dir="rtl" hint={t('pages.hints.title_desc')} />
            <Field label={t('pages.fields.cta')} value={ar.cta} onChange={(v) => setAr('cta', v)} readOnly={readOnly} dir="rtl" />
          </>
        )}
        {sectionKey === 'testimonials' && (
          <>
            <Field label={t('pages.fields.tag')} value={ar.tag} onChange={(v) => setAr('tag', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.title')} value={ar.title} onChange={(v) => setAr('title', v)} readOnly={readOnly} dir="rtl" />
            <Field label={t('pages.fields.subtitle')} value={ar.subtitle} onChange={(v) => setAr('subtitle', v)} readOnly={readOnly} multiline dir="rtl" />
            <Field label={t('pages.fields.quotes')} value={ar.quotes_text} onChange={(v) => setAr('quotes_text', v)} readOnly={readOnly} multiline rows={8} dir="rtl" hint={t('pages.hints.quotes')} />
          </>
        )}
        {sectionKey === 'cta' &&
          simpleFields.cta.map((field) => (
            <Field
              key={field}
              label={t(`pages.fields.${field === 'description' ? 'description' : field === 'primary' ? 'cta_primary' : field === 'secondary' ? 'cta_secondary' : field}`)}
              value={ar[field] ?? ''}
              onChange={(v) => setAr(field, v)}
              readOnly={readOnly}
              multiline={field === 'description'}
              dir="rtl"
            />
          ))}
      </div>
    </div>
  )
}

export default function HomePageEditor() {
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

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
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
