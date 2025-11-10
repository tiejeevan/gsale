import React, { useEffect, useState } from 'react';
import { useUserContext } from '../../context/UserContext';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  Select,
  Typography,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { adminService, type AdminUser } from '../../services/adminService';
import UserEditDialog from './UserEditDialog';
import ActionDialog from './ActionDialog';

const AdminUserManagement: React.FC = () => {
  const { token } = useUserContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Dialogs
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');

  // Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchQuery, statusFilter, roleFilter, includeDeleted]);

  const fetchUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUsers(token, {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
        status: statusFilter,
        role: roleFilter,
        includeDeleted,
      });

      setUsers(response.users);
      setTotalUsers(response.pagination.total);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: AdminUser) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleAction = (action: string, user: AdminUser) => {
    setSelectedUser(user);
    setActionType(action);
    setActionDialogOpen(true);
    handleMenuClose();
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleActionComplete = (message: string) => {
    setSuccess(message);
    setActionDialogOpen(false);
    setEditDialogOpen(false);
    fetchUsers();
    setTimeout(() => setSuccess(''), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'muted':
        return 'warning';
      case 'suspended':
        return 'error';
      case 'deactivated':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'secondary' : 'default';
  };

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          User Management
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search users..."
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              displayEmpty
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="muted">Muted</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="deactivated">Deactivated</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              displayEmpty
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={includeDeleted ? 'yes' : 'no'}
              onChange={(e) => {
                setIncludeDeleted(e.target.value === 'yes');
                setPage(0);
              }}
            >
              <MenuItem value="no">Active Only</MenuItem>
              <MenuItem value="yes">Include Deleted</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Users Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{
                      opacity: user.is_deleted ? 0.5 : 1,
                      bgcolor: user.is_deleted ? 'action.hover' : 'transparent',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={user.avatar_url}
                          alt={user.username}
                          sx={{ width: 40, height: 40 }}
                        >
                          {user.username[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.first_name} {user.last_name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={user.role} size="small" color={getRoleColor(user.role)} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_deleted ? 'Deleted' : user.status}
                        size="small"
                        color={user.is_deleted ? 'error' : getStatusColor(user.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Box>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {menuUser && !menuUser.is_deleted && (
          <>
            <MenuItem onClick={() => handleEdit(menuUser)}>
              <EditIcon sx={{ mr: 1, fontSize: 20 }} />
              Edit User
            </MenuItem>
            {menuUser.status === 'active' && (
              <>
                <MenuItem onClick={() => handleAction('mute', menuUser)}>
                  <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
                  Mute User
                </MenuItem>
                <MenuItem onClick={() => handleAction('suspend', menuUser)}>
                  <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
                  Suspend User
                </MenuItem>
              </>
            )}
            {menuUser.status === 'muted' && (
              <MenuItem onClick={() => handleAction('unmute', menuUser)}>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                Unmute User
              </MenuItem>
            )}
            {menuUser.status === 'suspended' && (
              <MenuItem onClick={() => handleAction('unsuspend', menuUser)}>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                Unsuspend User
              </MenuItem>
            )}
            <MenuItem onClick={() => handleAction('soft_delete', menuUser)}>
              <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
              Delete User
            </MenuItem>
          </>
        )}
        {menuUser && menuUser.is_deleted && (
          <>
            <MenuItem onClick={() => handleAction('restore', menuUser)}>
              <RestoreIcon sx={{ mr: 1, fontSize: 20 }} />
              Restore User
            </MenuItem>
            <MenuItem onClick={() => handleAction('permanent_delete', menuUser)}>
              <DeleteIcon sx={{ mr: 1, fontSize: 20, color: 'error.main' }} />
              Permanently Delete
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Edit Dialog */}
      {selectedUser && (
        <UserEditDialog
          open={editDialogOpen}
          user={selectedUser}
          onClose={() => setEditDialogOpen(false)}
          onSuccess={handleActionComplete}
        />
      )}

      {/* Action Dialog */}
      {selectedUser && (
        <ActionDialog
          open={actionDialogOpen}
          user={selectedUser}
          actionType={actionType}
          onClose={() => setActionDialogOpen(false)}
          onSuccess={handleActionComplete}
        />
      )}
    </Card>
  );
};

export default AdminUserManagement;
