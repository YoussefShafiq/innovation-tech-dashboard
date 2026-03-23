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
import { AUTH, SERVICES, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

function formatTags(tags) {
  if (tags == null || tags === '') return ''
  if (Array.isArray(tags))
    return tags.map((t) => String(t).trim()).filter(Boolean).join(', ')
  return String(tags)
}

function buildServiceFormData({ title, description, slug, icon, tags }) {
  const fd = new FormData()
  fd.append('title', title)
  fd.append('description', description ?? '')
  fd.append('slug', slug)
  fd.append('icon', icon ?? '')
  fd.append('tags', tags ?? '')
  return fd
}

/** Module scope — defining inside the table remounts inputs every keystroke (focus loss). */
function ServiceFormFields({ data, onChange, idPrefix = 'svc' }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border rounded-md"
          id={`${idPrefix}-desc`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
        <input
          type="text"
          value={data.icon}
          onChange={(e) => onChange({ ...data, icon: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g. code, cloud, shield"
          id={`${idPrefix}-icon`}
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
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

export default function ServicesDataTable({ services, loading, refetch }) {
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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    icon: '',
    tags: '',
  })

  const [editForm, setEditForm] = useState({
    id: null,
    title: '',
    description: '',
    slug: '',
    icon: '',
    tags: '',
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
    setFormData({
      title: '',
      description: '',
      slug: '',
      icon: '',
      tags: '',
    })
  }

  const openEdit = (svc) => {
    setEditForm({
      id: svc.id,
      title: svc.title ?? '',
      description: svc.description ?? '',
      slug: svc.slug ?? '',
      icon: svc.icon ?? '',
      tags: formatTags(svc.tags),
    })
    setShowEditModal(true)
  }

  const handleToggle = async (svc) => {
    setTogglingId(svc.id)
    try {
      await axios.patch(SERVICES.toggleActive(svc.id), {}, { headers: authHeaders() })
      const next = !svc.is_active
      toast.success(`Service ${next ? 'activated' : 'deactivated'}`, { duration: 2000 })
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request failed', { duration: 3000 })
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
      toast.success('Service deleted', { duration: 2000 })
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed', { duration: 3000 })
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
      toast.success('Service created', { duration: 2000 })
      setShowAddModal(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Create failed', { duration: 3000 })
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
      toast.success('Service updated', { duration: 2000 })
      setShowEditModal(false)
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed', { duration: 3000 })
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
        const blob = `${s.title ?? ''} ${s.slug ?? ''} ${formatTags(s.tags)} ${s.description ?? ''}`.toLowerCase()
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
      {is_active ? 'Active' : 'Inactive'}
    </span>
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex justify-between items-center mt-4 px-4 pb-1">
        <div className="text-xs">
          Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filtered.length)} of{' '}
          {filtered.length}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 disabled:opacity-50"
          >
            <FaChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 disabled:opacity-50"
          >
            <FaChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="shadow-2xl rounded-2xl overflow-hidden bg-white">
      <div className="p-4 border-b flex justify-between items-center gap-4">
        <input
          type="text"
          value={filters.global}
          onChange={(e) => handleFilterChange('global', e.target.value)}
          placeholder="Search services..."
          className="px-3 py-2 rounded-xl shadow-sm focus:outline-2 focus:outline-primary w-full border border-primary transition-all"
        />
        {account?.permissions?.includes('create_services') && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-darkBlue transition-all text-white px-3 py-2 rounded-xl shadow-sm min-w-max flex items-center gap-2"
          >
            <FaPlus size={18} />
            <span>Add service</span>
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
                  placeholder="Title"
                  value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                  className="text-xs p-1 border rounded w-full"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="text"
                  placeholder="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="text-xs p-1 border rounded w-full"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-3 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <FaSpinner className="animate-spin" size={18} />
                    Loading services…
                  </div>
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-3 py-4 text-center">
                  No services found
                </td>
              </tr>
            ) : (
              pageRows.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium max-w-[200px] truncate">{s.title}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-[140px] truncate">{s.slug}</td>
                  <td className="px-3 py-3 text-gray-600">{s.icon ?? '—'}</td>
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
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700 p-1"
                          onClick={() => openEdit(s)}
                        >
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
            className="fixed top-5 right-5 text-red-500 backdrop-blur-lg rounded-full z-50"
          >
            <XCircle size={40} />
          </button>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">New service</h2>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-darkBlue flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showEditModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <button type="button" onClick={() => setShowEditModal(false)} className="fixed top-5 right-5 text-red-500 backdrop-blur-lg rounded-full z-50">
            <XCircle size={40} />
          </button>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit service</h2>
            <form onSubmit={handleUpdate}>
              <ServiceFormFields data={editForm} onChange={setEditForm} idPrefix="edit" />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-darkBlue flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaEdit />}
                  Save
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
            <h3 className="text-lg font-medium text-gray-900">Delete service</h3>
            <p className="mt-2 text-sm text-gray-500">This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
