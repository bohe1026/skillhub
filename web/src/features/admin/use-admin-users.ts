import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/client'
import type { AdminUser, AdminUserCreateRequest, RegistrationInviteCreateRequest } from '@/api/types'
export type { AdminUser, RegistrationInvite } from '@/api/types'

/**
 * Admin user-management hooks for listing users and mutating their role or account status.
 */
export interface AdminUsersParams {
  search?: string
  status?: string
  page?: number
  size?: number
}

export interface PagedAdminUsers {
  items: AdminUser[]
  total: number
  page: number
  size: number
}

async function getAdminUsers(params: AdminUsersParams): Promise<PagedAdminUsers> {
  return adminApi.getUsers(params)
}

async function updateUserRole(userId: string, role: string): Promise<void> {
  await adminApi.updateUserRole(userId, role)
}

async function updateUserStatus(userId: string, status: 'ACTIVE' | 'DISABLED'): Promise<void> {
  await adminApi.updateUserStatus(userId, status)
}

async function createUser(request: AdminUserCreateRequest): Promise<void> {
  await adminApi.createUser(request)
}

export function useAdminUsers(params: AdminUsersParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => getAdminUsers(params),
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      // User role changes affect both the admin list and the current session when an administrator
      // edits their own account.
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'DISABLED' }) =>
      updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useApproveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminApi.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useDisableUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminApi.disableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useEnableUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminApi.enableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useSetUserPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      adminApi.setUserPassword(userId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useRegistrationInvites(params: { page?: number; size?: number }) {
  return useQuery({
    queryKey: ['admin', 'registration-invites', params],
    queryFn: () => adminApi.getRegistrationInvites(params),
  })
}

export function useCreateRegistrationInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: RegistrationInviteCreateRequest) => adminApi.createRegistrationInvite(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registration-invites'] })
    },
  })
}

export function useRevokeRegistrationInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: number) => adminApi.revokeRegistrationInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registration-invites'] })
    },
  })
}
