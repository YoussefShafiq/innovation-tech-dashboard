import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AUTH, USERS, PERMISSIONS_API, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js';
import {
    FaCheck,
    FaSpinner,
    FaPlus,
    FaTrashAlt,
    FaTimes,
    FaEdit,
    FaChevronRight,
    FaChevronLeft,
    FaLock,
    FaLockOpen
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminsDataTable({ admins, allPermissions, loading, refetch }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        global: '',
        name: '',
        email: '',
        status: '',
        role: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [togglingAdminId, setTogglingAdminId] = useState(null);
    const [deletingAdminId, setDeletingAdminId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);
    const [updatingAdmin, setUpdatingAdmin] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        permissions: []
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setCurrentPage(1);
    };

    const { data: profileRes } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
    })

    const account = useMemo(() => getAccountFromProfileResponse(profileRes), [profileRes])

    /** PATCH /users/{id}/toggle-active — no body; API flips active state */
    const handleToggleStatus = async (admin) => {
        setTogglingAdminId(admin.id);
        try {
            await axios.patch(USERS.toggleActive(admin.id), {}, { headers: authHeaders() });
            const next = !admin.is_active;
            toast.success(next ? t('admins.activated') : t('admins.deactivated'), { duration: 2000 });
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || t('common.unexpected_error'), { duration: 3000 });
            if (error.response?.status == 401) {
                localStorage.removeItem('userToken')
                navigate('/login')
            }
        } finally {
            setTogglingAdminId(null);
        }
    };

    const handleDeleteClick = (adminId) => {
        setAdminToDelete(adminId);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!adminToDelete) return;

        setDeletingAdminId(adminToDelete);
        setShowDeleteConfirm(false);

        try {
            await axios.delete(USERS.delete(adminToDelete), { headers: authHeaders() });
            toast.success(t('admins.deleted'), { duration: 2000 });
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || t('common.unexpected_error'), { duration: 3000 });
            if (error.response?.status == 401) {
                localStorage.removeItem('userToken')
                navigate('/login')
            }
            if (error.response?.status == 403) {
                toast.error(t('common.not_authorized'))
                navigate('/')
            }
        } finally {
            setDeletingAdminId(null);
            setAdminToDelete(null);
        }
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePermissionChange = (permission, isChecked) => {
        setFormData(prev => {
            if (isChecked) {
                return {
                    ...prev,
                    permissions: [...prev.permissions, permission]
                };
            } else {
                return {
                    ...prev,
                    permissions: prev.permissions.filter(p => p !== permission)
                };
            }
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            permissions: []
        });
    };

    const prepareEditForm = (admin) => {
        setSelectedAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            password: '',
            confirmPassword: '',
            permissions: [...(admin.permissions || [])]
        });
        setShowEditModal(true);
    };

    const preparePermissionsForm = (admin) => {
        setSelectedAdmin(admin);
        setFormData({
            ...formData,
            permissions: [...(admin.permissions || [])]
        });
        setShowPermissionsModal(true);
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error(t('admins.password_mismatch'), { duration: 3000 });
            return;
        }

        setUpdatingAdmin(true);
        try {
            const { data } = await axios.post(
                USERS.create,
                {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    password_confirmation: formData.confirmPassword,
                },
                { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
            );
            const newId = data?.data?.admin?.id;
            if (newId && formData.permissions?.length) {
                await axios.post(
                    PERMISSIONS_API.assign(newId),
                    { permissions: formData.permissions },
                    { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
                );
            }
            setUpdatingAdmin(false);
            toast.success(t('admins.added'), { duration: 2000 });
            setShowAddModal(false);
            resetForm();
            refetch();
        } catch (error) {
            setUpdatingAdmin(false);
            toast.error(error.response?.data?.message || t('common.unexpected_error'), { duration: 3000 });
            if (error.response?.status == 401) {
                localStorage.removeItem('userToken')
                navigate('/login')
            }
            if (error.response?.status == 403) {
                toast.error(t('common.not_authorized'))
                navigate('/')
            }
        }
    };

    const handleUpdateAdmin = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error(t('admins.password_mismatch'), { duration: 3000 });
            return;
        }

        setUpdatingAdmin(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
            };
            if (formData.password) {
                payload.password = formData.password;
                payload.password_confirmation = formData.confirmPassword;
            }

            await axios.put(USERS.update(selectedAdmin.id), payload, {
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            });
            setUpdatingAdmin(false);
            toast.success(t('admins.updated'), { duration: 2000 });
            setShowEditModal(false);
            resetForm();
            refetch();
        } catch (error) {
            setUpdatingAdmin(false);
            toast.error(error.response?.data?.message || t('common.unexpected_error'), { duration: 3000 });
            if (error.response?.status == 401) {
                localStorage.removeItem('userToken')
                navigate('/login')
            }
            if (error.response?.status == 403) {
                toast.error(t('common.not_authorized'))
                navigate('/')
            }
        }
    };

    const handleUpdatePermissions = async (e) => {
        e.preventDefault();

        setUpdatingAdmin(true);
        try {
            await axios.post(
                PERMISSIONS_API.assign(selectedAdmin.id),
                { permissions: formData.permissions },
                { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
            );
            setUpdatingAdmin(false);
            toast.success(t('admins.perms_updated'), { duration: 2000 });
            setShowPermissionsModal(false);
            resetForm();
            refetch();
        } catch (error) {
            setUpdatingAdmin(false);
            toast.error(error.response?.data?.message || t('common.unexpected_error'), { duration: 3000 });
            if (error.response?.status == 401) {
                localStorage.removeItem('userToken')
                navigate('/login')
            }
            if (error.response?.status == 403) {
                toast.error(t('common.not_authorized'))
                navigate('/')
            }
        }
    };

    const filteredAdmins = admins?.filter((admin) => {
        const statusStr = admin.is_active ? 'active' : 'inactive'
        return (
            (filters.global === '' ||
                admin.name.toLowerCase().includes(filters.global.toLowerCase()) ||
                admin.email.toLowerCase().includes(filters.global.toLowerCase())) &&
            (filters.name === '' ||
                admin.name.toLowerCase().includes(filters.name.toLowerCase())) &&
            (filters.email === '' ||
                admin.email.toLowerCase().includes(filters.email.toLowerCase())) &&
            (filters.status === '' || statusStr.includes(filters.status.toLowerCase())) &&
            (filters.role === '' || 'admin'.toLowerCase().includes(filters.role.toLowerCase()))
        )
    }) || [];

    // Pagination logic
    const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);
    const paginatedAdmins = filteredAdmins.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const statusBadge = (is_active) => {
        const statusClass = is_active
            ? 'bg-[#009379] text-white'
            : 'bg-[#930002] text-white';
        return (
            <span className={`flex justify-center w-fit items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusClass} min-w-16 text-center`}>
                {is_active ? t('common.active') : t('common.inactive')}
            </span>
        );
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex justify-between items-center mt-4 px-4 pb-1">
                <div className='text-xs'>
                    {t('pagination.showing', { start: (currentPage - 1) * rowsPerPage + 1, end: Math.min(currentPage * rowsPerPage, filteredAdmins.length), total: filteredAdmins.length })}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1 disabled:opacity-50"
                    >
                        <FaChevronLeft className={`h-4 w-4 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
                    </button>
                    <span className="px-3 py-1">
                        {t('pagination.page_of', { current: currentPage, total: totalPages })}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 disabled:opacity-50"
                    >
                        <FaChevronRight className={`h-4 w-4 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
        );
    };

    const closeBtnClass = i18n.dir() === 'rtl' ? 'fixed top-5 left-5 text-red-500 backdrop-blur-lg rounded-full z-50' : 'fixed top-5 right-5 text-red-500 backdrop-blur-lg rounded-full z-50';

    return (
        <div className="shadow-2xl rounded-2xl overflow-hidden bg-white">
            {/* Global Search and Add Button */}
            <div className="p-4 border-b flex justify-between items-center gap-4">
                <input
                    type="text"
                    value={filters.global}
                    onChange={(e) => handleFilterChange('global', e.target.value)}
                    placeholder={t('admins.search')}
                    className="px-3 py-2 rounded-xl shadow-sm focus:outline-2 focus:outline-primary w-full border border-primary transition-all"
                />
                {account?.permissions?.includes('create_admins') && <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary hover:bg-darkBlue transition-all text-white px-3 py-2 rounded-xl shadow-sm min-w-max flex items-center gap-2"
                >
                    <FaPlus size={18} />
                    <span>{t('admins.add')}</span>
                </button>}
            </div>

            {/* Table */}
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
                                    className="text-xs p-1 border rounded w-full"
                                />
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="text"
                                    placeholder={t('common.email')}
                                    value={filters.email}
                                    onChange={(e) => handleFilterChange('email', e.target.value)}
                                    className="text-xs p-1 border rounded w-full"
                                />
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('common.role')}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="text"
                                    placeholder={t('common.status')}
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="text-xs p-1 border rounded w-full"
                                />
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('common.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-3 py-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <FaSpinner className="animate-spin" size={18} />
                                        {t('admins.loading')}
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedAdmins.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-3 py-4 text-center">
                                    {t('admins.empty')}
                                </td>
                            </tr>
                        ) : (
                            paginatedAdmins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="font-medium">{admin.name}</div>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        {admin.email}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap capitalize text-gray-600">
                                        {t('admins.role_admin')}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        {statusBadge(admin.is_active)}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {
                                                account?.permissions?.includes('edit_admins') && <button
                                                    className="text-blue-500 hover:text-blue-700 p-1"
                                                    onClick={() => prepareEditForm(admin)}
                                                >
                                                    <FaEdit size={18} />
                                                </button>
                                            }

                                            {account?.permissions?.includes('assign_permissions') && <button
                                                className="text-purple-500 hover:text-purple-700 p-1"
                                                onClick={() => preparePermissionsForm(admin)}
                                            >
                                                <FaLock size={18} />
                                            </button>}

                                            {account?.permissions?.includes('edit_admins') && <button
                                                className={`${admin.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'} p-1`}
                                                onClick={() => handleToggleStatus(admin)}
                                                disabled={togglingAdminId === admin.id}
                                            >
                                                {togglingAdminId === admin.id ? (
                                                    <FaSpinner className="animate-spin" size={18} />
                                                ) : (
                                                    admin.is_active ? <FaTimes /> : <FaCheck />
                                                )}
                                            </button>}

                                            {account?.permissions?.includes('delete_admins') && <button
                                                className="text-red-500 hover:text-red-700 p-1"
                                                onClick={() => handleDeleteClick(admin.id)}
                                                disabled={deletingAdminId === admin.id}
                                            >
                                                {deletingAdminId === admin.id ? (
                                                    <FaSpinner className="animate-spin" size={18} />
                                                ) : (
                                                    <FaTrashAlt size={18} />
                                                )}
                                            </button>}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && renderPagination()}

            {/* Add Admin Modal */}
            {showAddModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                    <button type="button" onClick={() => {
                        setShowAddModal(false);
                    }} className={closeBtnClass} >
                        <XCircle className='' size={40} />
                    </button>
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">{t('admins.add_title')}</h2>
                            <form onSubmit={handleAddAdmin}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.password')}</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.confirm_password')}</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('admins.permissions_title')}</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                permissions: allPermissions.map(p => p.name)
                                            }));
                                        }}
                                        className="mb-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                    >
                                        {t('admins.select_all')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                permissions: []
                                            }));
                                        }}
                                        className="mb-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded ml-2"
                                    >
                                        {t('admins.clear_all')}
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                                        {allPermissions.map(permission => (
                                            <div key={permission.name} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`perm-${permission.name}`}
                                                    checked={formData.permissions.includes(permission.name)}
                                                    onChange={(e) => handlePermissionChange(permission.name, e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`perm-${permission.name}`} className="ml-2 text-sm text-gray-700">
                                                    <div className="font-medium">{permission.name.replaceAll('_', ' ')}</div>
                                                    <div className="text-xs text-gray-500">{permission.guard_name ?? 'api'}</div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-darkBlue transition-all flex items-center justify-center gap-2"
                                        disabled={updatingAdmin}
                                    >
                                        {updatingAdmin ? (
                                            <>
                                                <FaSpinner className="animate-spin" size={18} />
                                                <span>{t('admins.adding')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaPlus size={18} />
                                                <span>{t('admins.add')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Edit Admin Modal */}
            {showEditModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                    <button type="button" onClick={() => {
                        setShowEditModal(false);
                    }} className={closeBtnClass} >
                        <XCircle className='' size={40} />
                    </button>
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">{t('admins.edit_title')}</h2>
                            <form onSubmit={handleUpdateAdmin}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('admins.new_password_hint')}</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.confirm_password')}</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-darkBlue transition-all flex items-center justify-center gap-2"
                                        disabled={updatingAdmin}
                                    >
                                        {updatingAdmin ? (
                                            <>
                                                <FaSpinner className="animate-spin" size={18} />
                                                <span>{t('admins.updating')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaEdit size={18} />
                                                <span>{t('admins.update_admin_btn')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Permissions Modal */}
            {showPermissionsModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                    <button type="button" onClick={() => {
                        setShowPermissionsModal(false);
                    }} className={closeBtnClass} >
                        <XCircle className='' size={40} />
                    </button>
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">
                                {t('admins.manage_perms_for', { name: selectedAdmin?.name ?? '' })}
                            </h2>
                            <form onSubmit={handleUpdatePermissions}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('admins.permissions_title')}</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                permissions: allPermissions.map(p => p.name)
                                            }));
                                        }}
                                        className="mb-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                    >
                                        {t('admins.select_all')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                permissions: []
                                            }));
                                        }}
                                        className="mb-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded ml-2"
                                    >
                                        {t('admins.clear_all')}
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                                        {allPermissions.map(permission => (
                                            <div key={permission.name} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`perm-edit-${permission.name}`}
                                                    checked={formData.permissions.includes(permission.name)}
                                                    onChange={(e) => handlePermissionChange(permission.name, e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`perm-edit-${permission.name}`} className="ml-2 text-sm text-gray-700">
                                                    <div className="font-medium">{permission.name.replaceAll('_', ' ')}</div>
                                                    <div className="text-xs text-gray-500">{permission.guard_name ?? 'api'}</div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPermissionsModal(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-darkBlue transition-all flex items-center justify-center gap-2"
                                        disabled={updatingAdmin}
                                    >
                                        {updatingAdmin ? (
                                            <>
                                                <FaSpinner className="animate-spin" size={18} />
                                                <span>{t('admins.updating')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaLock size={18} />
                                                <span>{t('admins.update_perms_btn')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <FaTrashAlt className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">{t('admins.delete_title')}</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            {t('admins.delete_body')} {t('admins.delete_confirm_detail')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}