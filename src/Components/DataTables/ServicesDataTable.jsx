import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FaSpinner,
  FaPlus,
  FaTrashAlt,
  FaEdit,
  FaChevronRight,
  FaChevronLeft,
  FaCheck,
  FaTimes,
} from 'react-icons/fa'
import {
  MdCloudDone,
  MdSecurity,
  MdAutoGraph,
  MdDevices,
  MdIntegrationInstructions,
  MdSupportAgent,
  MdStorage,
  MdPhone,
} from 'react-icons/md'
import { useQuery } from '@tanstack/react-query'
import { XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AUTH, SERVICES, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

const SUPPORTED_ICONS = {
  MdCloudDone,
  MdSecurity,
  MdAutoGraph,
  MdDevices,
  MdIntegrationInstructions,
  MdSupportAgent,
  MdStorage,
  MdPhone,
}

const emptyAr = () => ({
  title: '',
  description: '',
  long_description: '',
  highlights: '',
})

function formatTags(tags) {
  if (tags == null || tags === '') return ''
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean).join(', ')
  return String(tags)
}

/** API may return highlights as string[], JSON string, or newline text from translations */
function formatHighlightsForForm(highlights) {
  if (highlights == null || highlights === '') return ''
  if (Array.isArray(highlights)) return highlights.filter(Boolean).join('\n')
  const s = String(highlights).trim()
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join('\n')
    } catch {
      /* ignore */
    }
  }
  return s
}

function normalizeTranslations(svc) {
  const raw = svc.translations || {}
  const ar = raw.ar || {}
  return {
    ar: {
      title: ar.title ?? '',
      description: ar.description ?? '',
      long_description: ar.long_description ?? '',
      highlights: formatHighlightsForForm(ar.highlights),
    },
  }
}

function ServiceIconPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
      {Object.entries(SUPPORTED_ICONS).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
            value === name
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-100 hover:border-gray-200 text-gray-400'
          }`}
          title={name}
        >
          <Icon size={20} />
          <span className="text-[9px] truncate w-full text-center">{name.replace('Md', '')}</span>
        </button>
      ))}
    </div>
  )
}

function buildServiceFormData({ title, description, long_description, slug, icon, tags, highlights, translations }) {
  const fd = new FormData()
  fd.append('title', title)
  fd.append('description', description ?? '')
  fd.append('long_description', long_description ?? '')
  fd.append('slug', slug)
  fd.append('icon', icon ?? '')
  fd.append('tags', tags ?? '')
  fd.append('highlights', highlights ?? '')
  if (translations) {
    Object.keys(translations).forEach((locale) => {
      Object.keys(translations[locale]).forEach((field) => {
        fd.append(`translations[${locale}][${field}]`, translations[locale][field] ?? '')
      })
    })
  }
  return fd
}

function ServiceFormFields({ data, onChange, idPrefix = 'svc' }) {
  const { t, i18n } = useTranslation()

  const handleTranslationChange = (locale, field, value) => {
    const translations = { ...data.translations }
    if (!translations[locale]) translations[locale] = emptyAr()
    translations[locale][field] = value
    onChange({ ...data, translations })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">{t('settings.story_en')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
              id={`${idPrefix}-title`}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.description')}</label>
            <textarea
              value={data.description}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              id={`${idPrefix}-desc`}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.long_description')}</label>
            <textarea
              value={data.long_description ?? ''}
              onChange={(e) => onChange({ ...data, long_description: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border rounded-md"
              id={`${idPrefix}-long`}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.highlights')}</label>
            <textarea
              value={data.highlights ?? ''}
              onChange={(e) => onChange({ ...data, highlights: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              placeholder={t('services.highlights_hint')}
              id={`${idPrefix}-highlights`}
            />
          </div>
        </div>
      </div>

      <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
        <h3 className="text-sm font-bold text-blue-500 mb-2 uppercase tracking-wider">{t('settings.story_ar')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
          <div className="md:col-span-2 text-right">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
            <input
              type="text"
              value={data.translations?.ar?.title || ''}
              onChange={(e) => handleTranslationChange('ar', 'title', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-right"
              id={`${idPrefix}-title-ar`}
            />
          </div>
          <div className="md:col-span-2 text-right">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.description')}</label>
            <textarea
              value={data.translations?.ar?.description || ''}
              onChange={(e) => handleTranslationChange('ar', 'description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-md text-right"
              id={`${idPrefix}-desc-ar`}
            />
          </div>
          <div className="md:col-span-2 text-right">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.long_description')}</label>
            <textarea
              value={data.translations?.ar?.long_description || ''}
              onChange={(e) => handleTranslationChange('ar', 'long_description', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border rounded-md text-right"
              id={`${idPrefix}-long-ar`}
            />
          </div>
          <div className="md:col-span-2 text-right">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.highlights')}</label>
            <textarea
              value={data.translations?.ar?.highlights || ''}
              onChange={(e) => handleTranslationChange('ar', 'highlights', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm text-right"
              placeholder={t('services.highlights_hint')}
              id={`${idPrefix}-highlights-ar`}
            />
          </div>
        </div>
      </div>

      <div className={`${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.slug')}</label>
        <input
          type="text"
          value={data.slug}
          onChange={(e) => onChange({ ...data, slug: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
          placeholder="e.g. software-development"
          id={`${idPrefix}-slug`}
        />
      </div>
      <div className={`md:col-span-2 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.icon')}</label>
        <ServiceIconPicker value={data.icon} onChange={(val) => onChange({ ...data, icon: val })} />
      </div>
      <div className={`md:col-span-2 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('services.tags')}</label>
        <input
          type="text"
          value={data.tags}
          onChange={(e) => onChange({ ...data, tags: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Comma-separated, e.g. Web, Mobile, AWS"
          id={`${idPrefix}-tags`}
        />
      </div>
    </div>
  )
}

const defaultForm = () => ({
  title: '',
  description: '',
  long_description: '',
  slug: '',
  icon: '',
  tags: '',
  highlights: '',
  translations: { ar: emptyAr() },
})

export default function ServicesDataTable({ services, loading, refetch }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    global: '',
    title: '',
    status: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState(defaultForm)

  const [editForm, setEditForm] = useState({
    id: null,
    ...defaultForm(),
  })

  const { data: profileRes } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const resetForm = () => {
    setFormData(defaultForm())
  }

  const openEdit = (svc) => {
    setEditForm({
      id: svc.id,
      title: svc.title ?? '',
      description: svc.description ?? '',
      long_description: svc.long_description ?? '',
      slug: svc.slug ?? '',
      icon: svc.icon ?? '',
      tags: formatTags(svc.tags),
      highlights: formatHighlightsForForm(svc.highlights),
      translations: normalizeTranslations(svc),
    })
    setShowEditModal(true)
  }

  const handleToggle = async (svc) => {
    setTogglingId(svc.id)
    try {
      await axios.patch(SERVICES.toggleActive(svc.id), {}, { headers: authHeaders() })
      const next = !svc.is_active
      toast.success(next ? t('common.active') : t('common.inactive'), { duration: 2000 })
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'), { duration: 3000 })
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!serviceToDelete) return
    setDeletingId(serviceToDelete)
    setShowDeleteConfirm(false)
    try {
      await axios.delete(SERVICES.delete(serviceToDelete), { headers: authHeaders() })
      toast.success(t('common.success'), { duration: 2000 })
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'), { duration: 3000 })
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    } finally {
      setDeletingId(null)
      setServiceToDelete(null)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = buildServiceFormData(formData)
      await axios.post(SERVICES.create, fd, {
        headers: { ...authHeaders() },
      })
      toast.success(t('common.success'), { duration: 2000 })
      setShowAddModal(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'), { duration: 3000 })
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editForm.id) return
    setSaving(true)
    try {
      const fd = buildServiceFormData(editForm)
      await axios.post(SERVICES.update(editForm.id), fd, {
        headers: { ...authHeaders() },
      })
      toast.success(t('common.success'), { duration: 2000 })
      setShowEditModal(false)
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'), { duration: 3000 })
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    return (
      services?.filter((s) => {
        const statusStr = s.is_active ? 'active' : 'inactive'
        const blob = `${s.title ?? ''} ${s.slug ?? ''} ${formatTags(s.tags)} ${s.description ?? ''} ${s.long_description ?? ''}`.toLowerCase()
        return (
          (filters.global === '' || blob.includes(filters.global.toLowerCase())) &&
          (filters.title === '' || (s.title ?? '').toLowerCase().includes(filters.title.toLowerCase())) &&
          (filters.status === '' || statusStr.includes(filters.status.toLowerCase()))
        )
      }) ?? []
    )
  }, [services, filters])

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const pageRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const statusBadge = (is_active) => (
    <span
      className={`flex justify-center w-fit items-center px-2.5 py-1 rounded-md text-xs font-medium min-w-16 text-center ${
        is_active ? 'bg-[#009379] text-white' : 'bg-[#930002] text-white'
      }`}
    >
      {is_active ? t('common.active') : t('common.inactive')}
    </span>
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex justify-between items-center mt-4 px-4 pb-1">
        <div className="text-xs">
          {t('pagination.showing', {
            start: (currentPage - 1) * rowsPerPage + 1,
            end: Math.min(currentPage * rowsPerPage, filtered.length),
            total: filtered.length,
          })}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 disabled:opacity-50"
          >
            <FaChevronLeft className={`h-4 w-4 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
          </button>
          <span className="px-3 py-1">{t('pagination.page_of', { current: currentPage, total: totalPages })}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 disabled:opacity-50"
          >
            <FaChevronRight className={`h-4 w-4 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    )
  }

  const closeBtnClass =
    i18n.dir() === 'rtl' ? 'fixed top-5 left-5 text-red-500 backdrop-blur-lg rounded-full z-50' : 'fixed top-5 right-5 text-red-500 backdrop-blur-lg rounded-full z-50'

  return (
    <div className="shadow-2xl rounded-2xl overflow-hidden bg-white">
      <div className="p-4 border-b flex justify-between items-center gap-4">
        <input
          type="text"
          value={filters.global}
          onChange={(e) => handleFilterChange('global', e.target.value)}
          placeholder={t('common.search')}
          className="px-3 py-2 rounded-xl shadow-sm focus:outline-2 focus:outline-primary w-full border border-primary transition-all text-sm"
        />
        {account?.permissions?.includes('create_services') && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-darkBlue transition-all text-white px-3 py-2 rounded-xl shadow-sm min-w-max flex items-center gap-2 text-sm"
          >
            <FaPlus size={18} />
            <span>{t('services.add_button')}</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="text"
                  placeholder={t('common.name')}
                  value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                  className="text-xs p-1 border rounded w-full"
                />
              </th>
              <th className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('services.slug')}</th>
              <th className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('services.icon')}</th>
              <th className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('services.tags')}</th>
              <th className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.author')}</th>
              <th className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="text"
                  placeholder={t('common.status')}
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="text-xs p-1 border rounded w-full"
                />
              </th>
              <th className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contacts.date')}</th>
              <th className="px-3 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-3 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <FaSpinner className="animate-spin" size={18} />
                    {t('services.loading_table')}
                  </div>
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-3 py-4 text-center">
                  {t('common.no_data')}
                </td>
              </tr>
            ) : (
              pageRows.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium max-w-[200px] truncate">{s.title}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-[140px] truncate">{s.slug}</td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      {SUPPORTED_ICONS[s.icon] ? React.createElement(SUPPORTED_ICONS[s.icon], { className: 'text-primary' }) : '—'}
                      <span className="text-xs text-gray-400">({s.icon})</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600 max-w-[180px] truncate" title={formatTags(s.tags)}>
                    {formatTags(s.tags) || '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{s.author?.name ?? '—'}</td>
                  <td className="px-3 py-3">{statusBadge(!!s.is_active)}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {s.created_at ? String(s.created_at).slice(0, 10) : '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {account?.permissions?.includes('edit_services') && (
                        <button type="button" className="text-blue-500 hover:text-blue-700 p-1" onClick={() => openEdit(s)}>
                          <FaEdit size={18} />
                        </button>
                      )}
                      {account?.permissions?.includes('edit_services') && (
                        <button
                          type="button"
                          className={`${s.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} p-1`}
                          onClick={() => handleToggle(s)}
                          disabled={togglingId === s.id}
                        >
                          {togglingId === s.id ? <FaSpinner className="animate-spin" size={18} /> : s.is_active ? <FaTimes /> : <FaCheck />}
                        </button>
                      )}
                      {account?.permissions?.includes('delete_services') && (
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => {
                            setServiceToDelete(s.id)
                            setShowDeleteConfirm(true)
                          }}
                          disabled={deletingId === s.id}
                        >
                          {deletingId === s.id ? <FaSpinner className="animate-spin" size={18} /> : <FaTrashAlt size={18} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && renderPagination()}

      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <button
            type="button"
            onClick={() => {
              setShowAddModal(false)
              resetForm()
            }}
            className={closeBtnClass}
          >
            <XCircle size={40} />
          </button>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{t('services.add_title')}</h2>
            <form onSubmit={handleAdd}>
              <ServiceFormFields data={formData} onChange={setFormData} idPrefix="add" />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-darkBlue flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                  {t('common.add')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showEditModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <button type="button" onClick={() => setShowEditModal(false)} className={closeBtnClass}>
            <XCircle size={40} />
          </button>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{t('services.edit_title')}</h2>
            <form onSubmit={handleUpdate}>
              <ServiceFormFields data={editForm} onChange={setEditForm} idPrefix="edit" />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-darkBlue flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaEdit />}
                  {t('common.save_changes')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900">{t('services.delete_title')}</h3>
            <p className="mt-2 text-sm text-gray-500">{t('services.delete_body')}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                {t('common.delete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
