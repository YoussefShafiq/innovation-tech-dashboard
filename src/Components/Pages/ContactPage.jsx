import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaSpinner, FaSave } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { AUTH, PAGES_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'
import PreviewShell from '../PagePreview/PreviewShell.jsx'
import ContactPreview from '../PagePreview/ContactPreview.jsx'

const SECTIONS = ['hero', 'info', 'form']

const FORM_FIELDS = [
  'title',
  'subtitle',
  'name_label',
  'name_placeholder',
  'email_label',
  'email_placeholder',
  'subject_label',
  'subject_placeholder',
  'message_label',
  'message_placeholder',
  'sent_title',
  'sent_desc',
  'send_another',
  'sending',
  'sending_btn',
  'submit',
  'success_toast',
  'error_toast',
  'subject_default',
]

function emptyForm() {
  return FORM_FIELDS.reduce((acc, key) => {
    acc[key] = ''
    return acc
  }, {})
}

function emptyContent() {
  return {
    hero: { eyebrow: '', title: '', description: '' },
    info: {
      tag: '',
      title: '',
      subtitle: '',
      email_label: '',
      phone_label: '',
      office_label: '',
    },
    form: emptyForm(),
  }
}

function apiToForm(data) {
  const content = data?.content || {}
  const arContent = data?.translations?.ar?.content || {}
  const en = emptyContent()
  const ar = emptyContent()

  const apply = (target, src) => {
    target.hero = { ...target.hero, ...(src.hero || {}) }
    target.info = { ...target.info, ...(src.info || {}) }
    target.form = { ...target.form, ...(src.form || {}) }
  }

  apply(en, content)
  apply(ar, arContent)

  return { en, ar }
}

function formToApi(formSection) {
  const s = formSection || emptyContent()
  const form = {}
  FORM_FIELDS.forEach((key) => {
    form[key] = s.form?.[key] ?? ''
  })
  return {
    hero: {
      eyebrow: s.hero.eyebrow ?? '',
      title: s.hero.title ?? '',
      description: s.hero.description ?? '',
    },
    info: {
      tag: s.info.tag ?? '',
      title: s.info.title ?? '',
      subtitle: s.info.subtitle ?? '',
      email_label: s.info.email_label ?? '',
      phone_label: s.info.phone_label ?? '',
      office_label: s.info.office_label ?? '',
    },
    form,
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
          ['hero.eyebrow', 'pages.contact_fields.eyebrow'],
          ['hero.title', 'pages.fields.title'],
          ['hero.description', 'pages.fields.description', { multiline: true, rows: 3 }],
        ]
      case 'info':
        return [
          ['info.tag', 'pages.fields.tag'],
          ['info.title', 'pages.fields.title'],
          ['info.subtitle', 'pages.fields.subtitle', { multiline: true }],
          ['info.email_label', 'pages.contact_fields.email_label'],
          ['info.phone_label', 'pages.contact_fields.phone_label'],
          ['info.office_label', 'pages.contact_fields.office_label'],
        ]
      case 'form':
        return [
          ['form.title', 'pages.fields.title'],
          ['form.subtitle', 'pages.fields.subtitle', { multiline: true }],
          ['form.name_label', 'pages.contact_fields.name_label'],
          ['form.name_placeholder', 'pages.contact_fields.name_placeholder'],
          ['form.email_label', 'pages.contact_fields.form_email_label'],
          ['form.email_placeholder', 'pages.contact_fields.email_placeholder'],
          ['form.subject_label', 'pages.contact_fields.subject_label'],
          ['form.subject_placeholder', 'pages.contact_fields.subject_placeholder'],
          ['form.message_label', 'pages.contact_fields.message_label'],
          ['form.message_placeholder', 'pages.contact_fields.message_placeholder', { multiline: true }],
          ['form.submit', 'pages.contact_fields.submit'],
          ['form.sending', 'pages.contact_fields.sending'],
          ['form.sending_btn', 'pages.contact_fields.sending_btn'],
          ['form.subject_default', 'pages.contact_fields.subject_default'],
          ['form.sent_title', 'pages.contact_fields.sent_title'],
          ['form.sent_desc', 'pages.contact_fields.sent_desc', { multiline: true }],
          ['form.send_another', 'pages.contact_fields.send_another'],
          ['form.success_toast', 'pages.contact_fields.success_toast', { multiline: true }],
          ['form.error_toast', 'pages.contact_fields.error_toast'],
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
  )
}

export default function ContactPageEditor() {
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
    queryKey: ['pageContent', 'contact'],
    queryFn: () => axios.get(PAGES_API.detail('contact'), { headers: authHeaders() }),
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
      return axios.put(
        PAGES_API.detail('contact'),
        { content, translations: { ar: { content: arContent } } },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
      )
    },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 2000 })
      queryClient.invalidateQueries({ queryKey: ['pageContent', 'contact'] })
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
        <h1 className="text-3xl font-bold text-gray-800">{t('pages.contact_title')}</h1>
        <p className="text-gray-600 text-sm mt-1 max-w-3xl">
          {t('pages.contact_subtitle')}{' '}
          <Link to="/settings" className="text-primary underline">{t('sidebar.settings')}</Link>
          {' · '}
          <Link to="/contacts" className="text-primary underline">{t('sidebar.contacts')}</Link>
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
            {t(`pages.contact_sections.${key}`)}
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
          title={t(`pages.contact_sections.${activeSection}`)}
          previewLocale={previewLocale}
          onPreviewLocaleChange={setPreviewLocale}
        >
          <ContactPreview content={form[previewLocale]} activeSection={activeSection} />
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
