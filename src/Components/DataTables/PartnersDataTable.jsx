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
import { AUTH, PARTNERS_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

function buildPartnerFormData({ name, order, is_active, logoFile }) {
  const fd = new FormData()
  fd.append('name', name)
  if (order !== '' && order != null) fd.append('order', String(order))
  fd.append('is_active', is_active ? '1' : '0')
  if (logoFile instanceof File) {
    fd.append('logo', logoFile)
  }
  return fd
}

export default function PartnersDataTable({ partners, loading, refetch }) {
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
  const [partnerToDelete, setPartnerToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    order: '',
    is_active: true,
    logoFile: null,
  })

  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    order: '',
    is_active: true,
    logoFile: null,
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
    setFormData({ name: '', order: '', is_active: true, logoFile: null })
  }

  const openEdit = (p) => {
    setEditForm({
      id: p.id,
      name: p.name ?? '',
      order: p.order != null ? String(p.order) : '',
      is_active: !!p.is_active,
      logoFile: null,
    })
    setShowEditModal(true)
  }

  const handleToggle = async (p) => {
    setTogglingId(p.id)
    try {
      await axios.patch(PARTNERS_API.toggleActive(p.id), {}, { headers: authHeaders() })
      const next = !p.is_active
      toast.success(next ? t('partners.activated') : t('partners.deactivated'), { duration: 2000 })
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
    if (!partnerToDelete) return
    setDeletingId(partnerToDelete)
    setShowDeleteConfirm(false)
    try {
      await axios.delete(PARTNERS_API.delete(partnerToDelete), { headers: authHeaders() })
      toast.success(t('partners.toast_deleted'), { duration: 2000 })
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'), { duration: 3000 })
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    } finally {
      setDeletingId(null)
      setPartnerToDelete(null)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = buildPartnerFormData(formData)
      await axios.post(PARTNERS_API.create, fd, { headers: { ...authHeaders() } })
      toast.success(t('partners.toast_created'), { duration: 2000 })
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
      const fd = buildPartnerFormData(editForm)
      await axios.post(PARTNERS_API.update(editForm.id), fd, { headers: { ...authHeaders() } })
      toast.success(t('partners.toast_updated'), { duration: 2000 })
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
      partners?.filter((p) => {
        const blob = `${p.name ?? ''} ${p.order ?? ''}`.toLowerCase()
        return (
          (filters.global === '' || blob.includes(filters.global.toLowerCase())) &&
          (filters.name === '' || (p.name ?? '').toLowerCase().includes(filters.name.toLowerCase()))
        )
      }) ?? []
    )
  }, [partners, filters])

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
          <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 disabled:opacity-50">
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
          placeholder={t('partners.search')}
          className="px-3 py-2 rounded-xl shadow-sm focus:outline-2 focus:outline-primary w-full border border-primary transition-all"
        />
        {account?.permissions?.includes('create_partners') && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-darkBlue transition-all text-white px-3 py-2 rounded-xl shadow-sm min-w-max flex items-center gap-2"
          >
            <FaPlus size={18} />
            <span>{t('partners.add')}</span>
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('partners.logo')}</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('partners.order')}</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <FaSpinner className="animate-spin" size={18} />
                    {t('partners.loading')}
                  </div>
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center">
                  {t('partners.empty')}
                </td>
              </tr>
            ) : (
              pageRows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium max-w-[220px] truncate">{p.name}</td>
                  <td className="px-3 py-3">
                    {p.logo ? (
                      <img src={p.logo} alt="" className="h-10 w-auto max-w-[100px] object-contain" />
                    ) : (
                      <span className="text-gray-400 text-xs">{t('partners.initials_only')}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{p.order ?? '—'}</td>
                  <td className="px-3 py-3">{statusBadge(!!p.is_active)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {account?.permissions?.includes('edit_partners') && (
                        <button type="button" className="text-blue-500 hover:text-blue-700 p-1" onClick={() => openEdit(p)}>
                          <FaEdit size={18} />
                        </button>
                      )}
                      {account?.permissions?.includes('edit_partners') && (
                        <button
                          type="button"
                          className={`${p.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} p-1`}
                          onClick={() => handleToggle(p)}
                          disabled={togglingId === p.id}
                        >
                          {togglingId === p.id ? <FaSpinner className="animate-spin" size={18} /> : p.is_active ? <FaTimes /> : <FaCheck />}
                        </button>
                      )}
                      {account?.permissions?.includes('delete_partners') && (
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => {
                            setPartnerToDelete(p.id)
                            setShowDeleteConfirm(true)
                          }}
                          disabled={deletingId === p.id}
                        >
                          {deletingId === p.id ? <FaSpinner className="animate-spin" size={18} /> : <FaTrashAlt size={18} />}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{t('partners.new_title')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('partners.new_help')}</p>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('partners.name_required')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('partners.sort_order')}</label>
                <input
                  type="number"
                  min={0}
                  value={formData.order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={t('partners.sort_placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('partners.logo_optional')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData((prev) => ({ ...prev, logoFile: e.target.files?.[0] ?? null }))}
                  className="w-full text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="add-active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                <label htmlFor="add-active" className="text-sm text-gray-700">
                  {t('partners.active_visible')}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
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
                  {t('partners.create_btn')}
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
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{t('partners.edit_title')}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('partners.name_required')}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('partners.sort_order')}</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.order}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, order: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('partners.replace_logo')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditForm((prev) => ({ ...prev, logoFile: e.target.files?.[0] ?? null }))}
                  className="w-full text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                <label htmlFor="edit-active" className="text-sm text-gray-700">
                  {t('common.active')}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-darkBlue flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaEdit />}
                  {t('partners.save_btn')}
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
            <h3 className="text-lg font-medium text-gray-900">{t('partners.delete_title')}</h3>
            <p className="mt-2 text-sm text-gray-500">{t('partners.delete_body')}</p>
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
