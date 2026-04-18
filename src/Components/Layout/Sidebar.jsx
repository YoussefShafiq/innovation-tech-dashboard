import React, { useContext, useState } from 'react'
import LogoMark from '../LogoMark'
import { NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'
import { SidebarContext } from '../../Contexts/SidebarContext'
import { GoSidebarExpand } from 'react-icons/go'
import { CiLogout } from 'react-icons/ci'
import { useQuery } from '@tanstack/react-query'
import { IoConstructOutline } from 'react-icons/io5'
import { RiAdminLine } from 'react-icons/ri'
import { ImProfile } from 'react-icons/im'
import { HiMail } from 'react-icons/hi'
import { IoSettingsOutline } from 'react-icons/io5'
import { FaHandshake } from 'react-icons/fa'
import { MdLanguage } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import { AUTH, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

export default function Sidebar() {
  const { t, i18n } = useTranslation()
  const { sidebarOpen, setSidebarOpen } = useContext(SidebarContext)
  const [loggingOut, setloggingOut] = useState(false)

  const navigate = useNavigate()

  async function handleLogout() {
    setloggingOut(true)
    try {
      await axios.post(AUTH.logout, {}, { headers: authHeaders() })
      localStorage.removeItem('userToken')
      navigate('/login')
      toast.success(t('sidebar.logout_success'), { duration: 2000 })
      setloggingOut(false)
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(t('common.error'))
        navigate('/')
      }
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken')
        navigate('/login')
      }
      setloggingOut(false)
      toast.error(error.response?.data?.message || t('common.error'), { duration: 3000 })
      localStorage.removeItem('userToken')
      navigate('/login')
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })

  const account = getAccountFromProfileResponse(currentUser)

  const sidebarPages = [
    {
      title: t('sidebar.admins'),
      path: '/admins',
      icon: <RiAdminLine />,
      permission: 'view_admins',
    },
    {
      title: t('sidebar.services'),
      path: '/services',
      icon: <IoConstructOutline />,
      permission: 'view_services',
    },
    {
      title: t('sidebar.contacts'),
      path: '/contacts',
      icon: <HiMail />,
      permission: 'view_contacts',
    },
    {
      title: t('sidebar.partners'),
      path: '/partners',
      icon: <FaHandshake />,
      permission: 'view_partners',
    },
    {
      title: t('sidebar.settings'),
      path: '/settings',
      icon: <IoSettingsOutline />,
      permission: 'view_settings',
    },
    {
      title: t('sidebar.user_settings'),
      path: '/user-setting',
      icon: <ImProfile />,
      permission: 'view_user_settings',
    },
  ]

  return (
    <div
      className={`h-full bg-transparent p-5 fixed w-56 transition-all duration-500 z-50 
            ${i18n.dir() === 'rtl' ? 'right-0' : 'left-0'} 
            ${sidebarOpen ? 'translate-x-0' : i18n.dir() === 'rtl' ? 'translate-x-full' : '-translate-x-full'}
        `}
    >
      <div
        className={`absolute z-50 transition-all duration-500 
                ${
                  sidebarOpen
                    ? `top-5 ${i18n.dir() === 'rtl' ? 'left-5 translate-x-1/2' : 'right-5 -translate-x-1/2'} translate-y-1/2 text-gray-400`
                    : `top-2 ${i18n.dir() === 'rtl' ? '-left-2 -translate-x-full' : '-right-2 translate-x-full'} p-1.5 flex justify-center items-center bg-white text-gray-700 bg-opacity-90 aspect-square rounded-full cursor-pointer`
                }
            `}
      >
        <button type="button" onClick={toggleSidebar}>
          <GoSidebarExpand className={`text-2xl ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <div className="h-full bg-primary rounded-2xl p-5 pt-10 flex flex-col justify-between overflow-y-auto shadow-xl">
        <div>
          <div className="flex justify-center items-center overflow-hidden mb-2 mx-auto">
            <LogoMark className="w-full" />
          </div>
          <div className="flex flex-col gap-1 text-gray-400 text-base">
            {sidebarPages.map((p) => (
              <React.Fragment key={p.path}>
                {(account?.permissions?.includes(p.permission) || p.permission === '') && (
                  <NavLink className="px-4 py-2 rounded-xl flex items-center gap-2" to={p.path}>
                    <div>{p.icon}</div>
                    {p.title}
                  </NavLink>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => i18n.changeLanguage(i18n.language.startsWith('ar') ? 'en' : 'ar')}
            className="bg-white/10 hover:bg-white/20 flex justify-center items-center text-white p-2 rounded-xl border border-white/20 gap-2 transition-colors text-sm"
          >
            <MdLanguage className="text-xl" />
            {i18n.language.startsWith('ar') ? 'English' : 'العربية'}
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="bg-gray-400 flex justify-center items-center text-white p-2 rounded-xl mb-2 gap-2 disabled:cursor-not-allowed disabled:opacity-50 capitalize"
          >
            {t('sidebar.logout')} <CiLogout className="text-2xl font-extrabold" />
          </button>
        </div>
      </div>
    </div>
  )
}
