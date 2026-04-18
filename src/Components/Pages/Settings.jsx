import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { AUTH, SETTINGS, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

function bulletsToText(bullets) {
  if (!bullets) return ''
  if (Array.isArray(bullets)) return bullets.map((b) => String(b).trim()).filter(Boolean).join('\n')
  return String(bullets)
}

function textToBullets(text) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function storyBulletsFromArValue(arVal) {
  if (arVal == null || arVal === '') return ''
  if (Array.isArray(arVal)) return bulletsToText(arVal)
  if (typeof arVal === 'string') {
    try {
      const p = JSON.parse(arVal)
      return Array.isArray(p) ? bulletsToText(p) : arVal
    } catch {
      return arVal
    }
  }
  return ''
}

const emptyAr = () => ({
  our_mission: '',
  our_vision: '',
  story_title: '',
  story_subtitle: '',
  story_description: '',
  story_bullets_text: '',
  address: '',
})

function SettingsFormFields({ form, onChange, readOnly }) {
  const ro = readOnly
    ? { readOnly: true, className: 'w-full px-3 py-2 border rounded-md bg-gray-50' }
    : { className: 'w-full px-3 py-2 border rounded-md' }
  const { t } = useTranslation()

  const handleTranslationChange = (field, value) => {
    const translations = { ...form.translations }
    if (!translations.ar) translations.ar = emptyAr()
    translations.ar[field] = value
    onChange({ ...form, translations })
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('settings.stats_title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['years', 'projects', 'clients', 'engineers'].map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t(`settings.${key}`)}</label>
              <input
                type="number"
                min={0}
                value={form[key]}
                onChange={(e) => onChange({ ...form, [key]: e.target.value })}
                {...ro}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t pt-8">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">{t('settings.mission_vision_en')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.mission_label')}</label>
              <textarea
                rows={3}
                value={form.our_mission}
                onChange={(e) => onChange({ ...form, our_mission: e.target.value })}
                {...ro}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.vision_label')}</label>
              <textarea
                rows={3}
                value={form.our_vision}
                onChange={(e) => onChange({ ...form, our_vision: e.target.value })}
                {...ro}
              />
            </div>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100" dir="rtl">
          <h2 className="text-sm font-bold text-blue-500 mb-4 uppercase tracking-wider">{t('settings.mission_vision_ar')}</h2>
          <div className="space-y-4">
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.mission_label')}</label>
              <textarea
                rows={3}
                value={form.translations?.ar?.our_mission || ''}
                onChange={(e) => handleTranslationChange('our_mission', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-right border-blue-200 focus:border-blue-500 outline-none"
                readOnly={readOnly}
              />
            </div>
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.vision_label')}</label>
              <textarea
                rows={3}
                value={form.translations?.ar?.our_vision || ''}
                onChange={(e) => handleTranslationChange('our_vision', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-right border-blue-200 focus:border-blue-500 outline-none"
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t pt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('settings.contact_info')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              placeholder="hello@example.com"
              {...ro}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.phone')}</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => onChange({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              {...ro}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">{t('settings.office_en')}</h3>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => onChange({ ...form, address: e.target.value })}
              placeholder="Street, City, State, ZIP"
              {...ro}
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100" dir="rtl">
            <h3 className="text-sm font-bold text-blue-500 mb-3 uppercase tracking-wider">{t('settings.office_ar')}</h3>
            <textarea
              rows={2}
              value={form.translations?.ar?.address || ''}
              onChange={(e) => handleTranslationChange('address', e.target.value)}
              placeholder="العنوان بالعربية…"
              className="w-full px-3 py-2 border rounded-md text-right border-blue-200 focus:border-blue-500 outline-none"
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t pt-8">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">{t('settings.story_en')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.story_title')}</label>
                <input type="text" value={form.story_title} onChange={(e) => onChange({ ...form, story_title: e.target.value })} {...ro} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.story_subtitle')}</label>
                <input type="text" value={form.story_subtitle} onChange={(e) => onChange({ ...form, story_subtitle: e.target.value })} {...ro} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.story_desc')}</label>
              <textarea rows={4} value={form.story_description} onChange={(e) => onChange({ ...form, story_description: e.target.value })} {...ro} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.story_bullets')}</label>
              <textarea
                rows={4}
                value={form.story_bullets_text}
                onChange={(e) => onChange({ ...form, story_bullets_text: e.target.value })}
                placeholder={'12+ years of experience\nTeam of 40+ engineers'}
                {...ro}
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100" dir="rtl">
          <h2 className="text-sm font-bold text-blue-500 mb-4 uppercase tracking-wider">{t('settings.story_ar')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-right">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.story_title')}</label>
                <input
                  type="text"
                  value={form.translations?.ar?.story_title || ''}
                  onChange={(e) => handleTranslationChange('story_title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-right border-blue-200 focus:border-blue-500 outline-none"
                  readOnly={readOnly}
                />
              </div>
              <div className="text-right">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.story_subtitle')}</label>
                <input
                  type="text"
                  value={form.translations?.ar?.story_subtitle || ''}
                  onChange={(e) => handleTranslationChange('story_subtitle', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-right border-blue-200 focus:border-blue-500 outline-none"
                  readOnly={readOnly}
                />
              </div>
            </div>
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.story_desc')}</label>
              <textarea
                rows={10}
                value={form.translations?.ar?.story_description || ''}
                onChange={(e) => handleTranslationChange('story_description', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-right border-blue-200 focus:border-blue-500 outline-none"
                readOnly={readOnly}
              />
            </div>
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.story_bullets')}</label>
              <textarea
                rows={4}
                value={form.translations?.ar?.story_bullets_text || ''}
                onChange={(e) => handleTranslationChange('story_bullets_text', e.target.value)}
                placeholder="أكثر من 12 عاماً من الخبرة…"
                className="w-full px-3 py-2 border rounded-md text-right border-blue-200 focus:border-blue-500 outline-none"
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function mapApiToForm(data) {
  if (!data) return null
  const s = data.story || {}
  const tr = data.translations || {}
  const ar = tr.ar || {}
  return {
    years: data.years ?? '',
    projects: data.projects ?? '',
    clients: data.clients ?? '',
    engineers: data.engineers ?? '',
    our_mission: data.our_mission ?? '',
    our_vision: data.our_vision ?? '',
    story_title: s.title ?? '',
    story_subtitle: s.subtitle ?? '',
    story_description: s.description ?? '',
    story_bullets_text: bulletsToText(s.bullets),
    email: data.email ?? '',
    phone: data.phone ?? '',
    address: data.address ?? '',
    translations: {
      ar: {
        our_mission: ar.our_mission ?? '',
        our_vision: ar.our_vision ?? '',
        story_title: ar.story_title ?? '',
        story_subtitle: ar.story_subtitle ?? '',
        story_description: ar.story_description ?? '',
        story_bullets_text: storyBulletsFromArValue(ar.story_bullets),
        address: ar.address ?? '',
      },
    },
  }
}

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => ({
    years: '',
    projects: '',
    clients: '',
    engineers: '',
    our_mission: '',
    our_vision: '',
    story_title: '',
    story_subtitle: '',
    story_description: '',
    story_bullets_text: '',
    email: '',
    phone: '',
    address: '',
    translations: { ar: emptyAr() },
  }))

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])
  const canView = account?.permissions?.includes('view_settings')
  const canEdit = account?.permissions?.includes('edit_settings')

  const {
    data: settingsRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: () => axios.get(SETTINGS.resource, { headers: authHeaders() }),
    enabled: !profileLoading && !!canView,
  })

  useEffect(() => {
    const d = settingsRes?.data?.data
    const next = mapApiToForm(d)
    if (next) setForm(next)
  }, [settingsRes])

  useEffect(() => {
    if (!isError || !error) return
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('userToken')
      navigate('/login')
    }
    if (status === 403) {
      toast.error(t('settings.not_authorized'))
      navigate('/')
    }
  }, [isError, error, navigate, t])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        years: Number(form.years) || 0,
        projects: Number(form.projects) || 0,
        clients: Number(form.clients) || 0,
        engineers: Number(form.engineers) || 0,
        our_mission: form.our_mission,
        our_vision: form.our_vision,
        story_title: form.story_title,
        story_subtitle: form.story_subtitle,
        story_description: form.story_description,
        story_bullets: textToBullets(form.story_bullets_text),
        email: form.email,
        phone: form.phone,
        address: form.address,
        translations: {
          ar: (() => {
            const ar = { ...(form.translations?.ar || {}) }
            delete ar.story_bullets_text
            return {
              ...ar,
              story_bullets: JSON.stringify(textToBullets(form.translations?.ar?.story_bullets_text || '')),
            }
          })(),
        },
      }
      return axios.put(SETTINGS.resource, payload, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      })
    },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 2000 })
      queryClient.invalidateQueries({ queryKey: ['globalSettings'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('settings.save_failed'), { duration: 4000 })
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
        <p className="text-gray-600">{t('settings.no_permission')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{t('settings.title')}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600 py-12 justify-center">
            <FaSpinner className="animate-spin" />
            {t('common.loading')}
          </div>
        ) : (
          <SettingsFormFields form={form} onChange={setForm} readOnly={!canEdit} />
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
