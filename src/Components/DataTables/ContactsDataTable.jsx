import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaSpinner, FaTrashAlt, FaEye, FaChevronRight, FaChevronLeft, FaEnvelope } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { XCircle } from 'lucide-react'
import { AUTH, CONTACTS, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

/** Module scope — avoids input/modal remount focus issues */
function ContactDetailModal({ contact, onClose }) {
  if (!contact) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-start gap-4">
          <div className="flex items-center gap-2 text-primary">
            <FaEnvelope className="text-xl" />
            <h2 className="text-xl font-bold text-gray-800">Message</h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1" aria-label="Close">
            <XCircle size={28} />
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500">From</h3>
            <p className="mt-1 font-medium text-gray-900">{contact.name}</p>
            <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
              {contact.email}
            </a>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500">Subject</h3>
            <p className="mt-1 text-gray-800">{contact.subject ?? '—'}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500">Message</h3>
            <p className="mt-1 text-gray-800 whitespace-pre-wrap">{contact.message ?? '—'}</p>
          </div>
          {contact.created_at && (
            <p className="text-xs text-gray-500 pt-2 border-t">
              Received {new Date(contact.created_at).toLocaleString()}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ContactsDataTable({ contacts, loading, refetch }) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ global: '', name: '', email: '', subject: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contactToDelete, setContactToDelete] = useState(null)
  const [detailContact, setDetailContact] = useState(null)

  const { data: profileRes } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!contactToDelete) return
    setDeletingId(contactToDelete)
    setShowDeleteConfirm(false)
    try {
      await axios.delete(CONTACTS.delete(contactToDelete), { headers: authHeaders() })
      toast.success('Contact deleted', { duration: 2000 })
      if (detailContact?.id === contactToDelete) setDetailContact(null)
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed', { duration: 3000 })
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
    } finally {
      setDeletingId(null)
      setContactToDelete(null)
    }
  }

  const filtered = useMemo(() => {
    return (
      contacts?.filter((c) => {
        const blob = `${c.name ?? ''} ${c.email ?? ''} ${c.subject ?? ''} ${c.message ?? ''}`.toLowerCase()
        return (
          (filters.global === '' || blob.includes(filters.global.toLowerCase())) &&
          (filters.name === '' || (c.name ?? '').toLowerCase().includes(filters.name.toLowerCase())) &&
          (filters.email === '' || (c.email ?? '').toLowerCase().includes(filters.email.toLowerCase())) &&
          (filters.subject === '' || (c.subject ?? '').toLowerCase().includes(filters.subject.toLowerCase()))
        )
      }) ?? []
    )
  }, [contacts, filters])

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const pageRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

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
      <div className="p-4 border-b">
        <input
          type="text"
          value={filters.global}
          onChange={(e) => handleFilterChange('global', e.target.value)}
          placeholder="Search name, email, subject, message…"
          className="px-3 py-2 rounded-xl shadow-sm focus:outline-2 focus:outline-primary w-full border border-primary transition-all"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="text"
                  placeholder="Name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  className="text-xs p-1 border rounded w-full max-w-[140px]"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="text"
                  placeholder="Email"
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                  className="text-xs p-1 border rounded w-full max-w-[180px]"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="text"
                  placeholder="Subject"
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="text-xs p-1 border rounded w-full max-w-[140px]"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <FaSpinner className="animate-spin" size={18} />
                    Loading contacts…
                  </div>
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center text-gray-500">
                  No contact submissions
                </td>
              </tr>
            ) : (
              pageRows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium max-w-[160px] truncate">{c.name}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-[200px] truncate">{c.email}</td>
                  <td className="px-3 py-3 text-gray-700 max-w-[220px] truncate" title={c.subject}>
                    {c.subject ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {c.created_at ? String(c.created_at).slice(0, 10) : '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {account?.permissions?.includes('view_contacts') && (
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700 p-1"
                          onClick={() => setDetailContact(c)}
                          aria-label="View message"
                        >
                          <FaEye size={18} />
                        </button>
                      )}
                      {account?.permissions?.includes('delete_contacts') && (
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => {
                            setContactToDelete(c.id)
                            setShowDeleteConfirm(true)
                          }}
                          disabled={deletingId === c.id}
                        >
                          {deletingId === c.id ? <FaSpinner className="animate-spin" size={18} /> : <FaTrashAlt size={18} />}
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

      {detailContact && (
        <ContactDetailModal contact={detailContact} onClose={() => setDetailContact(null)} />
      )}

      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900">Delete submission</h3>
            <p className="mt-2 text-sm text-gray-500">This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
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
