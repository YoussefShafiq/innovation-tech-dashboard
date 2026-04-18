import { useState } from 'react'
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Login from './Components/Auth/Login'
import ProtectedRoute from './Components/Auth/ProtectedRoute'
import Layout from './Components/Layout/Layout'
import { Toaster } from 'react-hot-toast'
import SidebarContextProvider from './Contexts/SidebarContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Notfound from './Components/Notfound'
import Services from './Components/Pages/Services'
import Home from './Components/Pages/Home'
import UserSetting from './Components/Pages/UserSetting'
import Contacts from './Components/Pages/Contacts'
import Settings from './Components/Pages/Settings'
import ErrorPage from './Components/errorHandling/ErrorPage'
import Admins from './Components/Pages/Admins.jsx'
import Partners from './Components/Pages/Partners.jsx'

function AppToaster() {
  const { i18n } = useTranslation()
  return (
    <Toaster
      position={i18n.dir() === 'rtl' ? 'bottom-left' : 'bottom-right'}
      reverseOrder={false}
    />
  )
}

function App() {

  const router = createBrowserRouter([
    { path: '/login', element: <Login /> },
    {
      path: '/', element: <ProtectedRoute><Layout /></ProtectedRoute>, errorElement: <ErrorPage />, children: [
        { index: true, element: <ProtectedRoute><Home /></ProtectedRoute> },
        { path: '/admins', element: <ProtectedRoute><Admins /></ProtectedRoute> },
        { path: '/services', element: <ProtectedRoute><Services /></ProtectedRoute> },
        { path: '/contacts', element: <ProtectedRoute><Contacts /></ProtectedRoute> },
        { path: '/partners', element: <ProtectedRoute><Partners /></ProtectedRoute> },
        { path: '/settings', element: <ProtectedRoute><Settings /></ProtectedRoute> },
        { path: '/user-setting', element: <ProtectedRoute><UserSetting /></ProtectedRoute> },

      ]
    },
    { path: '*', element: <Notfound /> }
  ])

  let query = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return (
    <>
      <SidebarContextProvider>
        <QueryClientProvider client={query}>
          <RouterProvider router={router} />
          <AppToaster />
        </QueryClientProvider>
      </SidebarContextProvider>
    </>
  )
}

export default App
