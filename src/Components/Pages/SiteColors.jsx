import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave, FaCopy, FaUndo } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { AUTH, THEME, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

export const THEME_DEFAULTS = {
  primary: '#F7941D',
  primary_light: '#FBB55A',
  primary_dark: '#D97706',
  secondary: '#2B3990',
  secondary_light: '#4A5BC4',
  secondary_dark: '#1A2460',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text_primary: '#0F172A',
  text_secondary: '#64748B',
  dark_surface: '#060B1F',
}

const COLOR_GROUPS = [
  {
    id: 'primary',
    titleKey: 'theme.group_primary',
    keys: ['primary', 'primary_light', 'primary_dark'],
  },
  {
    id: 'secondary',
    titleKey: 'theme.group_secondary',
    keys: ['secondary', 'secondary_light', 'secondary_dark'],
  },
  {
    id: 'surfaces',
    titleKey: 'theme.group_surfaces',
    keys: ['background', 'surface'],
  },
  {
    id: 'text',
    titleKey: 'theme.group_text',
    keys: ['text_primary', 'text_secondary'],
  },
  {
    id: 'dark',
    titleKey: 'theme.group_dark',
    keys: ['dark_surface'],
  },
]

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

function normalizeHex(value) {
  if (value == null) return null
  let v = String(value).trim()
  if (!v) return null
  if (v[0] !== '#') v = `#${v}`
  if (!HEX_RE.test(v)) return null
  let hex = v.slice(1).toUpperCase()
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  return `#${hex}`
}

function toColorInputValue(hex) {
  const n = normalizeHex(hex)
  return n || '#000000'
}

function ColorField({ label, value, onChange, readOnly, t }) {
  const [hexDraft, setHexDraft] = useState(value)

  useEffect(() => {
    setHexDraft(value)
  }, [value])

  const commitHex = () => {
    const n = normalizeHex(hexDraft)
    if (!n) {
      toast.error(t('theme.invalid_hex'))
      setHexDraft(value)
      return
    }
    setHexDraft(n)
    onChange(n)
  }

  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('theme.copied'), { duration: 1500 })
    } catch {
      toast.error(t('theme.copy_failed'))
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
      <div className="sm:w-40 shrink-0">
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <input
          type="color"
          value={toColorInputValue(value)}
          disabled={readOnly}
          onChange={(e) => {
            const n = normalizeHex(e.target.value)
            if (n) onChange(n)
          }}
          className="h-10 w-14 cursor-pointer rounded border border-gray-200 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={label}
        />
        <div
          className="h-10 w-10 rounded-lg border border-gray-200 shadow-inner shrink-0"
          style={{ backgroundColor: toColorInputValue(value) }}
          title={value}
        />
        <input
          type="text"
          value={hexDraft}
          readOnly={readOnly}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitHex()
            }
          }}
          spellCheck={false}
          className={`font-mono text-sm px-3 py-2 border rounded-md w-32 ${
            readOnly ? 'bg-gray-50' : 'bg-white'
          }`}
          placeholder="#RRGGBB"
        />
        <button
          type="button"
          onClick={copyHex}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border rounded-md hover:bg-white hover:border-gray-300 transition-colors"
          title={t('theme.copy')}
        >
          <FaCopy className="text-xs" />
          {t('theme.copy')}
        </button>
      </div>
    </div>
  )
}

function ThemePreview({ form }) {
  const { t } = useTranslation()
  return (
    <div
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ backgroundColor: form.background }}
    >
      <div
        className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: form.dark_surface, color: '#fff' }}
      >
        <span className="font-semibold text-sm tracking-wide">{t('theme.preview_title')}</span>
        <div className="flex gap-2">
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: form.primary }}
          >
            {t('theme.preview_primary_btn')}
          </span>
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: form.secondary }}
          >
            {t('theme.preview_secondary_btn')}
          </span>
        </div>
      </div>
      <div className="p-5 space-y-2" style={{ backgroundColor: form.surface }}>
        <p className="font-semibold" style={{ color: form.text_primary }}>
          {t('theme.preview_heading')}
        </p>
        <p className="text-sm" style={{ color: form.text_secondary }}>
          {t('theme.preview_body')}
        </p>
        <div className="flex gap-2 pt-2">
          <span
            className="h-3 w-10 rounded-full"
            style={{ backgroundColor: form.primary_light }}
          />
          <span
            className="h-3 w-10 rounded-full"
            style={{ backgroundColor: form.primary_dark }}
          />
          <span
            className="h-3 w-10 rounded-full"
            style={{ backgroundColor: form.secondary_light }}
          />
          <span
            className="h-3 w-10 rounded-full"
            style={{ backgroundColor: form.secondary_dark }}
          />
        </div>
      </div>
    </div>
  )
}

export default function SiteColors() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => ({ ...THEME_DEFAULTS }))

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])
  const canView = account?.permissions?.includes('view_settings')
  const canEdit = account?.permissions?.includes('edit_settings')

  const {
    data: themeRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['siteTheme'],
    queryFn: () => axios.get(THEME.resource, { headers: authHeaders() }),
    enabled: !profileLoading && !!canView,
  })

  useEffect(() => {
    const theme = themeRes?.data?.data?.theme
    if (theme && typeof theme === 'object') {
      setForm({ ...THEME_DEFAULTS, ...theme })
    }
  }, [themeRes])

  useEffect(() => {
    if (!isError || !error) return
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('userToken')
      navigate('/login')
    }
    if (status === 403) {
      toast.error(t('theme.not_authorized'))
      navigate('/')
    }
  }, [isError, error, navigate, t])

  const setColor = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const theme = {}
      for (const key of Object.keys(THEME_DEFAULTS)) {
        const n = normalizeHex(form[key])
        if (!n) {
          throw new Error(t('theme.invalid_hex'))
        }
        theme[key] = n
      }
      return axios.put(
        THEME.resource,
        { theme },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } },
      )
    },
    onSuccess: (res) => {
      toast.success(t('common.success'), { duration: 2000 })
      const theme = res?.data?.data?.theme
      if (theme) setForm({ ...THEME_DEFAULTS, ...theme })
      queryClient.invalidateQueries({ queryKey: ['siteTheme'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || t('theme.save_failed'), {
        duration: 4000,
      })
      if (err.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    },
  })

  const resetMutation = useMutation({
    mutationFn: () =>
      axios.post(THEME.reset, {}, { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }),
    onSuccess: (res) => {
      toast.success(t('theme.reset_success'), { duration: 2000 })
      const theme = res?.data?.data?.theme
      setForm(theme ? { ...THEME_DEFAULTS, ...theme } : { ...THEME_DEFAULTS })
      queryClient.invalidateQueries({ queryKey: ['siteTheme'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('theme.reset_failed'), { duration: 4000 })
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
        <p className="text-gray-600">{t('theme.no_permission')}</p>
      </div>
    )
  }

  const busy = saveMutation.isPending || resetMutation.isPending

  return (
    <div className="p-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('theme.title')}</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">{t('theme.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600 py-12 justify-center">
            <FaSpinner className="animate-spin" />
            {t('common.loading')}
          </div>
        ) : (
          <div className="space-y-8">
            <ThemePreview form={form} />

            {COLOR_GROUPS.map((group) => (
              <section key={group.id} className="border-t pt-6 first:border-t-0 first:pt-0">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">{t(group.titleKey)}</h2>
                <div className="space-y-3">
                  {group.keys.map((key) => (
                    <ColorField
                      key={key}
                      label={t(`theme.colors.${key}`)}
                      value={form[key] || THEME_DEFAULTS[key]}
                      onChange={(v) => setColor(key, v)}
                      readOnly={!canEdit}
                      t={t}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {canEdit && !isLoading && (
        <div className="flex flex-wrap justify-end gap-3 sticky bottom-4 z-10">
          <button
            type="button"
            onClick={() => resetMutation.mutate()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-md disabled:opacity-50"
          >
            {resetMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaUndo />}
            <span className="font-semibold">{t('theme.reset')}</span>
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={busy}
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
