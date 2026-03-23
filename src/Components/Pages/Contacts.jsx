import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ContactsDataTable from '../DataTables/ContactsDataTable'
import { CONTACTS, authHeaders } from '../../constants/urls.js'

function normalizeContactsList(res) {
  const raw = res?.data?.data
  return Array.isArray(raw) ? raw : []
}

export default function Contacts() {
  const navigate = useNavigate()

  const { data: contactsRes, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => axios.get(CONTACTS.list, { headers: authHeaders() }),
  })

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

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Contact submissions</h1>
      <ContactsDataTable
        contacts={normalizeContactsList(contactsRes)}
        loading={isLoading}
        refetch={refetch}
      />
    </div>
  )
}
