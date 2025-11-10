import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { 
  Refresh as RefreshIcon, 
  Storage as StorageIcon,
  TableChart as TableIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useUserContext } from '../context/UserContext';
import WatchUser from '../components/admin/WatchUser';

interface TableInfo {
  name: string;
  columnCount: number;
  rowCount: number;
  error?: string;
}

interface DatabaseStats {
  tableCount: number;
  viewCount: number;
  databaseSize: string;
}

const DatabaseGUI: React.FC = () => {
  const { token, currentUser } = useUserContext();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  const [rowCount, setRowCount] = useState(0);
  const [mainTab, setMainTab] = useState(0); // 0 = Database Tables, 1 = Watch User

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Check if user is admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Fetch tables and stats on mount
  useEffect(() => {
    fetchTables();
    fetchStats();
  }, []);

  // Fetch table data when selection changes
  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable, paginationModel]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/database/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setTables(data.tables);
        if (data.tables.length > 0 && !selectedTable) {
          setSelectedTable(data.tables[0].name);
        }
      } else {
        setError(data.error || 'Failed to fetch tables');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/database/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchTableData = async (tableName: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/database/tables/${tableName}/data?page=${paginationModel.page}&pageSize=${paginationModel.pageSize}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (response.ok) {
        setTableData(data.data);
        setRowCount(data.pagination.totalRows);

        // Generate columns from data
        if (data.data.length > 0) {
          const cols: GridColDef[] = Object.keys(data.data[0]).map((key) => ({
            field: key,
            headerName: key.replace(/_/g, ' ').toUpperCase(),
            width: 150,
            flex: 1,
            valueFormatter: (value: any) => {
              if (value === null) return 'NULL';
              if (typeof value === 'object') return JSON.stringify(value);
              if (typeof value === 'boolean') return value ? 'true' : 'false';
              return value;
            }
          }));
          setColumns(cols);
        } else {
          setColumns([]);
        }
      } else {
        setError(data.error || 'Failed to fetch table data');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTables();
    fetchStats();
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Database GUI
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab label="Database Tables" />
          <Tab label="Watch User" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Watch User Tab */}
      {mainTab === 1 && <WatchUser />}

      {/* Database Tables Tab */}
      {mainTab === 0 && (
        <>
          {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TableIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">{stats.tableCount}</Typography>
                <Typography variant="body2" color="text.secondary">Tables</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <ViewIcon color="secondary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">{stats.viewCount}</Typography>
                <Typography variant="body2" color="text.secondary">Views</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <StorageIcon color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">{stats.databaseSize}</Typography>
                <Typography variant="body2" color="text.secondary">Database Size</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tables Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={selectedTable}
              onChange={(_, newValue) => setSelectedTable(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tables.map((table) => (
                <Tab
                  key={table.name}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {table.name}
                      <Chip 
                        label={table.rowCount} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                  }
                  value={table.name}
                />
              ))}
            </Tabs>
          </Box>

          {/* Data Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : tableData.length > 0 ? (
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={tableData}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[25, 50, 100]}
                rowCount={rowCount}
                paginationMode="server"
                loading={loading}
                getRowId={(row) => row.id || Math.random()}
                sx={{
                  '& .MuiDataGrid-cell': {
                    fontSize: '0.875rem',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                  },
                }}
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No data available in this table
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </Box>
  );
};

export default DatabaseGUI;
