import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave } from 'react-icons/fa'
import {
  AUTH,
  SETTINGS,
  authHeaders,
  getAccountFromProfileResponse,
} from '../../constants/urls.js'

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

/** Module scope — stable identity for controlled inputs */
function SettingsFormFields({ form, onChange, readOnly }) {
  const ro = readOnly ? { readOnly: true, className: 'w-full px-3 py-2 border rounded-md bg-gray-50' } : { className: 'w-full px-3 py-2 border rounded-md' }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Stats (homepage)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['years', 'projects', 'clients', 'engineers'].map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
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

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mission &amp; vision</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Our mission</label>
            <textarea
              rows={3}
              value={form.our_mission}
              onChange={(e) => onChange({ ...form, our_mission: e.target.value })}
              {...ro}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Our vision</label>
            <textarea
              rows={3}
              value={form.our_vision}
              onChange={(e) => onChange({ ...form, our_vision: e.target.value })}
              {...ro}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Story (About)</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.story_title}
                onChange={(e) => onChange({ ...form, story_title: e.target.value })}
                {...ro}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={form.story_subtitle}
                onChange={(e) => onChange({ ...form, story_subtitle: e.target.value })}
                {...ro}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={6}
              value={form.story_description}
              onChange={(e) => onChange({ ...form, story_description: e.target.value })}
              {...ro}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bullets (one per line)</label>
            <textarea
              rows={8}
              value={form.story_bullets_text}
              onChange={(e) => onChange({ ...form, story_bullets_text: e.target.value })}
              placeholder="12+ years of experience&#10;Team of 40+ engineers"
              {...ro}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function mapApiToForm(data) {
  if (!data) return null
  const s = data.story || {}
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
  }
}

export default function Settings() {
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
      toast.error('You are not authorized to view this page')
      navigate('/home')
    }
  }, [isError, error, navigate])

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
      }
      return axios.put(SETTINGS.resource, payload, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      })
    },
    onSuccess: () => {
      toast.success('Settings saved', { duration: 2000 })
      queryClient.invalidateQueries({ queryKey: ['globalSettings'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Save failed', { duration: 4000 })
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
        Loading…
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="p-4">
        <p className="text-gray-600">You don&apos;t have permission to view site settings.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Site settings</h1>
        {canEdit && (
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-darkBlue transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaSave />}
            Save changes
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600 py-12 justify-center">
            <FaSpinner className="animate-spin" />
            Loading settings…
          </div>
        ) : (
          <SettingsFormFields form={form} onChange={setForm} readOnly={!canEdit} />
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Public marketing site content (stats, story, mission). Matches{' '}
        <code className="bg-gray-100 px-1 rounded">PUT /api/admin/settings</code> in the API.
      </p>
    </div>
  )
}
