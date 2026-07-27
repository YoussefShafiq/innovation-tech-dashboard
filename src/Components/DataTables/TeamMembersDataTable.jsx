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
import { useQuery } from '@tanstack/react-query'
import { XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AUTH, TEAM_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

function buildTeamFormData({ name, title, is_active, imageFile, name_ar, title_ar }) {
  const fd = new FormData()
  fd.append('name', name)
  fd.append('title', title)
  fd.append('is_active', is_active ? '1' : '0')
  if (imageFile instanceof File) {
    fd.append('image', imageFile)
  }
  if (name_ar != null) fd.append('translations[ar][name]', name_ar)
  if (title_ar != null) fd.append('translations[ar][title]', title_ar)
  return fd
}

function arFromMember(m) {
  const ar = m?.translations?.ar || {}
  return {
    name_ar: ar.name ?? '',
    title_ar: ar.title ?? '',
  }
}

export default function TeamMembersDataTable({ members, loading, refetch }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ global: '', name: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = {
    name: '',
    title: '',
    name_ar: '',
    title_ar: '',
    is_active: true,
    imageFile: null,
  }

  const [formData, setFormData] = useState(emptyForm)
  const [editForm, setEditForm] = useState({ id: null, ...emptyForm })

  const { data: profileRes } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const resetForm = () => setFormData(emptyForm)

  const openEdit = (m) => {
    const ar = arFromMember(m)
    setEditForm({
      id: m.id,
      name: m.name ?? '',
      title: m.title ?? '',
      name_ar: ar.name_ar,
      title_ar: ar.title_ar,
      is_active: !!m.is_active,
      imageFile: null,
    })
    setShowEditModal(true)
  }

  const handleToggle = async (m) => {
    setTogglingId(m.id)
    try {
      await axios.patch(TEAM_API.toggleActive(m.id), {}, { headers: authHeaders() })
      toast.success(!m.is_active ? t('team.activated') : t('team.deactivated'), { duration: 2000 })
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
    if (!memberToDelete) return
    setDeletingId(memberToDelete)
    setShowDeleteConfirm(false)
    try {
      await axios.delete(TEAM_API.delete(memberToDelete), { headers: authHeaders() })
      toast.success(t('team.toast_deleted'), { duration: 2000 })
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'), { duration: 3000 })
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    } finally {
      setDeletingId(null)
      setMemberToDelete(null)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = buildTeamFormData(formData)
      await axios.post(TEAM_API.create, fd, { headers: { ...authHeaders() } })
      toast.success(t('team.toast_created'), { duration: 2000 })
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
      const fd = buildTeamFormData(editForm)
      await axios.post(TEAM_API.update(editForm.id), fd, { headers: { ...authHeaders() } })
      toast.success(t('team.toast_updated'), { duration: 2000 })
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
      members?.filter((m) => {
        const blob = `${m.name ?? ''} ${m.title ?? ''}`.toLowerCase()
        return (
          (filters.global === '' || blob.includes(filters.global.toLowerCase())) &&
          (filters.name === '' || (m.name ?? '').toLowerCase().includes(filters.name.toLowerCase()))
        )
      }) ?? []
    )
  }, [members, filters])

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

  const closeBtnClass =
    i18n.dir() === 'rtl'
      ? 'fixed top-5 left-5 text-red-500 backdrop-blur-lg rounded-full z-50'
      : 'fixed top-5 right-5 text-red-500 backdrop-blur-lg rounded-full z-50'

  const MemberFormFields = ({ value, onChange, idPrefix }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('team.name_en')}</label>
          <input
            type="text"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div dir="rtl" className="text-right">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('team.name_ar')}</label>
          <input
            type="text"
            value={value.name_ar}
            onChange={(e) => onChange({ ...value, name_ar: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-right border-blue-100"
            dir="rtl"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('team.title_en')}</label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div dir="rtl" className="text-right">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('team.title_ar')}</label>
          <input
            type="text"
            value={value.title_ar}
            onChange={(e) => onChange({ ...value, title_ar: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-right border-blue-100"
            dir="rtl"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('team.image')}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange({ ...value, imageFile: e.target.files?.[0] ?? null })}
          className="w-full text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`${idPrefix}-active`}
          type="checkbox"
          checked={value.is_active}
          onChange={(e) => onChange({ ...value, is_active: e.target.checked })}
        />
        <label htmlFor={`${idPrefix}-active`} className="text-sm text-gray-700">
          {t('team.active_visible')}
        </label>
      </div>
    </div>
  )

  return (
    <div className="shadow-2xl rounded-2xl overflow-hidden bg-white">
      <div className="p-4 border-b flex justify-between items-center gap-4">
        <input
          type="text"
          value={filters.global}
          onChange={(e) => handleFilterChange('global', e.target.value)}
          placeholder={t('team.search')}
          className="px-3 py-2 rounded-xl shadow-sm focus:outline-2 focus:outline-primary w-full border border-primary transition-all"
        />
        {account?.permissions?.includes('create_team') && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-darkBlue transition-all text-white px-3 py-2 rounded-xl shadow-sm min-w-max flex items-center gap-2"
          >
            <FaPlus size={18} />
            <span>{t('team.add')}</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="text"
                  placeholder={t('common.name')}
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  className="text-xs p-1 border rounded w-full max-w-[160px]"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('team.job_title')}</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('team.photo')}</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <FaSpinner className="animate-spin" size={18} />
                    {t('team.loading')}
                  </div>
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center">
                  {t('team.empty')}
                </td>
              </tr>
            ) : (
              pageRows.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium max-w-[220px] truncate">{m.name}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-[220px] truncate">{m.title}</td>
                  <td className="px-3 py-3">
                    {m.image ? (
                      <img src={m.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">{t('team.no_photo')}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{statusBadge(!!m.is_active)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {account?.permissions?.includes('edit_team') && (
                        <button type="button" className="text-blue-500 hover:text-blue-700 p-1" onClick={() => openEdit(m)}>
                          <FaEdit size={18} />
                        </button>
                      )}
                      {account?.permissions?.includes('edit_team') && (
                        <button
                          type="button"
                          className={`${m.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} p-1`}
                          onClick={() => handleToggle(m)}
                          disabled={togglingId === m.id}
                        >
                          {togglingId === m.id ? <FaSpinner className="animate-spin" size={18} /> : m.is_active ? <FaTimes /> : <FaCheck />}
                        </button>
                      )}
                      {account?.permissions?.includes('delete_team') && (
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => {
                            setMemberToDelete(m.id)
                            setShowDeleteConfirm(true)
                          }}
                          disabled={deletingId === m.id}
                        >
                          {deletingId === m.id ? <FaSpinner className="animate-spin" size={18} /> : <FaTrashAlt size={18} />}
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

      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-4 pb-4">
          <div className="text-xs">
            {t('pagination.showing', {
              start: (currentPage - 1) * rowsPerPage + 1,
              end: Math.min(currentPage * rowsPerPage, filtered.length),
              total: filtered.length,
            })}
          </div>
          <div className="flex gap-1 items-center">
            <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 disabled:opacity-50">
              <FaChevronLeft className={`h-4 w-4 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
            </button>
            <span className="px-3 py-1 text-sm">{t('pagination.page_of', { current: currentPage, total: totalPages })}</span>
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
      )}

      {showAddModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <button type="button" onClick={() => { setShowAddModal(false); resetForm() }} className={closeBtnClass}>
            <XCircle size={40} />
          </button>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{t('team.new_title')}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <MemberFormFields value={formData} onChange={setFormData} idPrefix="add" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm() }} className="px-4 py-2 border rounded-md">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-md inline-flex items-center gap-2">
                  {saving ? <FaSpinner className="animate-spin" /> : null}
                  {t('team.create_btn')}
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
            className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{t('team.edit_title')}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <MemberFormFields value={editForm} onChange={setEditForm} idPrefix="edit" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-md">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-md inline-flex items-center gap-2">
                  {saving ? <FaSpinner className="animate-spin" /> : null}
                  {t('team.save_btn')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showDeleteConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2">{t('team.delete_title')}</h2>
            <p className="text-gray-600 mb-6">{t('team.delete_body')}</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border rounded-md">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
