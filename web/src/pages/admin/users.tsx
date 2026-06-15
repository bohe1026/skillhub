import { KeyboardEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatLocalDateTime } from '@/shared/lib/date-time'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  normalizeSelectValue,
} from '@/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { CopyButton } from '@/shared/components/copy-button'
import {
  useAdminUsers,
  useApproveUser,
  useCreateRegistrationInvite,
  useCreateUser,
  useDisableUser,
  useEnableUser,
  useRegistrationInvites,
  useRevokeRegistrationInvite,
  useSetUserPassword,
  useUpdateUserRole,
} from '@/features/admin/use-admin-users'
import type { AdminUser } from '@/features/admin/use-admin-users'

type CreateUserForm = {
  username: string
  email: string
  password: string
}

/**
 * Admin user management page that combines search, status filtering, approval,
 * activation control, and role changes in one route-level container.
 */
export function AdminUsersPage() {
  const { t, i18n } = useTranslation()
  const allStatusFilterValue = '__all_statuses__'
  const roleOptions = [
    { value: 'USER', label: t('adminUsers.roleUser') },
    { value: 'SKILL_ADMIN', label: t('adminUsers.roleReviewer') },
    { value: 'USER_ADMIN', label: t('adminUsers.roleUserAdmin') },
    { value: 'AUDITOR', label: t('adminUsers.roleAuditor') },
    { value: 'SUPER_ADMIN', label: t('adminUsers.roleSuperAdmin') },
  ]
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({ username: '', email: '', password: '' })
  const [createUserError, setCreateUserError] = useState<string | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteLabel, setInviteLabel] = useState('')
  const [inviteMaxUses, setInviteMaxUses] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'ban' | 'unban'>('ban')

  const { data, isLoading } = useAdminUsers({
    search,
    status: statusFilter || undefined,
    page,
    size: 20,
  })

  const updateRoleMutation = useUpdateUserRole()
  const createUserMutation = useCreateUser()
  const approveUserMutation = useApproveUser()
  const disableUserMutation = useDisableUser()
  const enableUserMutation = useEnableUser()
  const setUserPasswordMutation = useSetUserPassword()
  const invitesQuery = useRegistrationInvites({ page: 0, size: 20 })
  const createInviteMutation = useCreateRegistrationInvite()
  const revokeInviteMutation = useRevokeRegistrationInvite()

  const formatDate = (dateString: string) => {
    return formatLocalDateTime(dateString, i18n.language)
  }

  useEffect(() => {
    setPage(0)
  }, [search, statusFilter])

  const applySearch = () => {
    setSearch(searchInput.trim())
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      applySearch()
    }
  }

  const handleChangeRole = (user: AdminUser) => {
    setSelectedUser(user)
    // The current backend model effectively treats the first platform role as
    // the primary editable role in this screen.
    setNewRole(user.platformRoles[0] || 'USER')
    setRoleDialogOpen(true)
  }

  const handleToggleStatus = (user: AdminUser, action: 'ban' | 'unban') => {
    setSelectedUser(user)
    setActionType(action)
    setConfirmDialogOpen(true)
  }

  const handleSetPassword = (user: AdminUser) => {
    setSelectedUser(user)
    setTemporaryPassword('')
    setPasswordError(null)
    setPasswordDialogOpen(true)
  }

  const openCreateUserDialog = () => {
    setCreateUserForm({ username: '', email: '', password: '' })
    setCreateUserError(null)
    setCreateDialogOpen(true)
  }

  const openInviteDialog = () => {
    setInviteLabel('')
    setInviteMaxUses('')
    setInviteError(null)
    setInviteDialogOpen(true)
  }

  const confirmRoleChange = async () => {
    if (!selectedUser || !newRole || newRole === (selectedUser.platformRoles[0] || 'USER')) return
    try {
      await updateRoleMutation.mutateAsync({ userId: selectedUser.userId, role: newRole })
      setRoleDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const confirmUserAction = async () => {
    if (!selectedUser) return
    try {
      if (actionType === 'ban') {
        await disableUserMutation.mutateAsync(selectedUser.userId)
      } else {
        await enableUserMutation.mutateAsync(selectedUser.userId)
      }
      setConfirmDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to apply user action:', error)
    }
  }

  const confirmSetPassword = async () => {
    if (!selectedUser) return
    const nextPassword = temporaryPassword
    if (!nextPassword) {
      setPasswordError(t('adminUsers.passwordRequired'))
      return
    }
    try {
      await setUserPasswordMutation.mutateAsync({ userId: selectedUser.userId, newPassword: nextPassword })
      setPasswordDialogOpen(false)
      setSelectedUser(null)
      setTemporaryPassword('')
      setPasswordError(null)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t('adminUsers.passwordUpdateFailed'))
    }
  }

  const confirmCreateUser = async () => {
    const username = createUserForm.username.trim()
    const email = createUserForm.email.trim().toLowerCase()
    const password = createUserForm.password
    if (!username || !email || !password) {
      setCreateUserError(t('adminUsers.createUserRequired'))
      return
    }
    try {
      await createUserMutation.mutateAsync({ username, email, password })
      setCreateDialogOpen(false)
      setCreateUserForm({ username: '', email: '', password: '' })
      setCreateUserError(null)
    } catch (error) {
      setCreateUserError(error instanceof Error ? error.message : t('adminUsers.createUserFailed'))
    }
  }

  const createInvite = async () => {
    const trimmedMaxUses = inviteMaxUses.trim()
    const maxUses = trimmedMaxUses ? Number(trimmedMaxUses) : undefined
    if (maxUses !== undefined && (!Number.isInteger(maxUses) || maxUses <= 0)) {
      setInviteError(t('adminUsers.inviteMaxUsesInvalid'))
      return
    }
    try {
      await createInviteMutation.mutateAsync({
        label: inviteLabel.trim() || undefined,
        maxUses,
      })
      setInviteLabel('')
      setInviteMaxUses('')
      setInviteError(null)
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : t('adminUsers.inviteCreateFailed'))
    }
  }

  const isInviteExpired = (expiresAt?: string | null) => expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold font-heading mb-2">{t('adminUsers.title')}</h1>
          <p className="text-muted-foreground text-lg">{t('adminUsers.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={openInviteDialog}>
            {t('adminUsers.inviteManage')}
          </Button>
          <Button type="button" onClick={openCreateUserDialog}>
            {t('adminUsers.createUser')}
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_220px]">
          <div className="space-y-2">
            <Label htmlFor="admin-user-search">{t('adminUsers.searchLabel')}</Label>
            <div className="flex gap-2">
              <Input
                id="admin-user-search"
                placeholder={t('adminUsers.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1"
              />
              <Button type="button" onClick={applySearch}>
                {t('adminUsers.searchAction')}
              </Button>
              <Button type="button" variant="outline" onClick={clearSearch} disabled={!searchInput && !search}>
                {t('adminUsers.clearSearch')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminUsers.searchHint')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-user-status">{t('adminUsers.filterLabel')}</Label>
            <Select
              value={normalizeSelectValue(statusFilter) ?? allStatusFilterValue}
              onValueChange={(value) => setStatusFilter(value === allStatusFilterValue ? '' : value)}
            >
              <SelectTrigger id="admin-user-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allStatusFilterValue}>{t('adminUsers.filterAll')}</SelectItem>
                <SelectItem value="ACTIVE">{t('adminUsers.filterActive')}</SelectItem>
                <SelectItem value="PENDING">{t('adminUsers.filterPending')}</SelectItem>
                <SelectItem value="DISABLED">{t('adminUsers.filterDisabled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-shimmer rounded-lg" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{t('adminUsers.empty')}</p>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminUsers.colUsername')}</TableHead>
                  <TableHead>{t('adminUsers.colUserId')}</TableHead>
                  <TableHead>{t('adminUsers.colEmail')}</TableHead>
                  <TableHead>{t('adminUsers.colStatus')}</TableHead>
                  <TableHead>{t('adminUsers.colRole')}</TableHead>
                  <TableHead>{t('adminUsers.colCreatedAt')}</TableHead>
                  <TableHead>{t('adminUsers.colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground min-w-0 max-w-[14rem] truncate" title={user.userId}>{user.userId}</span>
                        <CopyButton text={user.userId} ariaLabel={t('adminUsers.copyUserId', { username: user.username })} />
                      </div>
                    </TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                            : user.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                              : 'bg-red-500/10 text-red-700 border-red-500/20'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? t('adminUsers.statusActive') : user.status === 'PENDING' ? t('adminUsers.statusPending') : t('adminUsers.statusDisabled')}
                      </span>
                    </TableCell>
                    <TableCell>{user.platformRoles.join(', ')}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeRole(user)}
                        >
                          {t('adminUsers.changeRole')}
                        </Button>
                        {user.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveUserMutation.mutate(user.userId)}
                          >
                            {t('adminUsers.approveUser')}
                          </Button>
                        )}
                        {user.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user, 'ban')}
                          >
                            {t('adminUsers.disable')}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user, 'unban')}
                          >
                            {t('adminUsers.enable')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPassword(user)}
                        >
                          {t('adminUsers.setPassword')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {t('adminUsers.totalRecords', { total: data.total, page: page + 1 })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                {t('adminUsers.prevPage')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * 20 >= data.total}
                onClick={() => setPage(page + 1)}
              >
                {t('adminUsers.nextPage')}
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.createUserTitle')}</DialogTitle>
            <DialogDescription>{t('adminUsers.createUserDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-user-username">{t('adminUsers.createUsername')}</Label>
              <Input
                id="create-user-username"
                value={createUserForm.username}
                onChange={(event) => setCreateUserForm((current) => ({ ...current, username: event.target.value }))}
                placeholder={t('adminUsers.createUsernamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-email">{t('adminUsers.createEmail')}</Label>
              <Input
                id="create-user-email"
                type="email"
                value={createUserForm.email}
                onChange={(event) => setCreateUserForm((current) => ({ ...current, email: event.target.value }))}
                placeholder={t('adminUsers.createEmailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-password">{t('adminUsers.createPassword')}</Label>
              <Input
                id="create-user-password"
                type="password"
                value={createUserForm.password}
                onChange={(event) => setCreateUserForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={t('adminUsers.createPasswordPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('adminUsers.passwordPolicyHint')}</p>
            </div>
            {createUserError ? <p className="text-sm text-red-600">{createUserError}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button onClick={confirmCreateUser} disabled={createUserMutation.isPending}>
              {t('dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="w-[min(calc(100vw-2rem),56rem)] p-0">
          <DialogHeader>
            <div className="px-6 pt-7 sm:px-8">
              <DialogTitle>{t('adminUsers.inviteManageTitle')}</DialogTitle>
              <DialogDescription>{t('adminUsers.inviteManageDesc')}</DialogDescription>
            </div>
          </DialogHeader>
          <div className="max-h-[calc(100vh-12rem)] space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="invite-label">{t('adminUsers.inviteLabel')}</Label>
                <Input
                  id="invite-label"
                  value={inviteLabel}
                  onChange={(event) => {
                    setInviteLabel(event.target.value)
                    setInviteError(null)
                  }}
                  placeholder={t('adminUsers.inviteLabelPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-max-uses">{t('adminUsers.inviteMaxUses')}</Label>
                <Input
                  id="invite-max-uses"
                  inputMode="numeric"
                  value={inviteMaxUses}
                  onChange={(event) => {
                    setInviteMaxUses(event.target.value)
                    setInviteError(null)
                  }}
                  placeholder={t('adminUsers.inviteMaxUsesPlaceholder')}
                />
              </div>
              <Button onClick={createInvite} disabled={createInviteMutation.isPending}>
                {t('adminUsers.inviteCreate')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminUsers.inviteCreateHint')}</p>
            {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}

            <div className="space-y-3">
              {invitesQuery.isLoading ? (
                <Card className="p-5 text-sm text-muted-foreground">{t('adminUsers.inviteLoading')}</Card>
              ) : !invitesQuery.data || invitesQuery.data.items.length === 0 ? (
                <Card className="p-5 text-sm text-muted-foreground">{t('adminUsers.inviteEmpty')}</Card>
              ) : (
                invitesQuery.data.items.map((invite) => {
                  const expired = isInviteExpired(invite.expiresAt)
                  const exhausted = invite.maxUses != null && invite.usedCount >= invite.maxUses
                  const active = !invite.revoked && !expired && !exhausted
                  const expiresAt = invite.expiresAt ? formatDate(invite.expiresAt) : t('adminUsers.inviteNeverExpires')
                  return (
                    <Card key={invite.id} className="p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${
                              active
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                                : 'border-slate-300 bg-slate-100 text-slate-600'
                            }`}
                            >
                              {invite.revoked
                                ? t('adminUsers.inviteRevoked')
                                : expired
                                  ? t('adminUsers.inviteExpired')
                                  : exhausted
                                    ? t('adminUsers.inviteExhausted')
                                    : t('adminUsers.inviteActive')}
                            </span>
                            <span className="text-sm font-medium text-slate-700">{invite.label || t('adminUsers.inviteUntitled')}</span>
                          </div>
                          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                            <code className="min-w-0 break-all rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 font-mono text-xs text-blue-950">
                              {invite.code}
                            </code>
                            <CopyButton text={invite.code} ariaLabel={t('adminUsers.inviteCopy', { code: invite.code })} />
                          </div>
                          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                            <span>{t('adminUsers.inviteUsage')}: <b className="font-semibold text-slate-700">{invite.maxUses ? `${invite.usedCount}/${invite.maxUses}` : `${invite.usedCount}/∞`}</b></span>
                            <span>{t('adminUsers.inviteExpiresAt')}: <b className="font-semibold text-slate-700">{expiresAt}</b></span>
                            <span>{t('adminUsers.inviteCreatedAt')}: <b className="font-semibold text-slate-700">{formatDate(invite.createdAt)}</b></span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeInviteMutation.mutate(invite.id)}
                          disabled={invite.revoked || revokeInviteMutation.isPending}
                          className="shrink-0"
                        >
                          {t('adminUsers.inviteRevoke')}
                        </Button>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
          <DialogFooter className="border-t border-blue-100 px-6 py-4 sm:px-8">
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              {t('dialog.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.changeRoleTitle')}</DialogTitle>
            <DialogDescription>
              {t('adminUsers.changeRoleDesc', { username: selectedUser?.username })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">{t('adminUsers.roleLabel')}</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={
                updateRoleMutation.isPending
                || !selectedUser
                || !newRole
                || newRole === (selectedUser.platformRoles[0] || 'USER')
              }
            >
              {t('dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.confirmAction')}</DialogTitle>
            <DialogDescription>
              {actionType === 'ban'
                ? t('adminUsers.confirmDisable', { username: selectedUser?.username })
                : t('adminUsers.confirmEnable', { username: selectedUser?.username })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button
              onClick={confirmUserAction}
              disabled={disableUserMutation.isPending || enableUserMutation.isPending}
            >
              {t('dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.setPasswordTitle')}</DialogTitle>
            <DialogDescription>
              {t('adminUsers.setPasswordDesc', { username: selectedUser?.username })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="temporary-password">{t('adminUsers.temporaryPassword')}</Label>
              <Input
                id="temporary-password"
                type="password"
                value={temporaryPassword}
                onChange={(event) => {
                  setTemporaryPassword(event.target.value)
                  setPasswordError(null)
                }}
                placeholder={t('adminUsers.temporaryPasswordPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('adminUsers.passwordPolicyHint')}</p>
            </div>
            {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button onClick={confirmSetPassword} disabled={setUserPasswordMutation.isPending}>
              {t('dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
