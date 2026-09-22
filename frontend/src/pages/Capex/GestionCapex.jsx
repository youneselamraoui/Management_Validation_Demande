import React from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Box, TextField, Button, Dialog, DialogActions, DialogTitle,
  IconButton, Typography, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Sidebar from "../../components/Sidebar";
import axios from 'axios';

const Header = ({ title, subtitle }) => (
  <Box mb="30px">
    <Typography variant="h5" fontWeight="bold">{title}</Typography>
    <Typography variant="body2" color="textSecondary">{subtitle}</Typography>
  </Box>
);

export default function GestionCapex() {
  const [capexList, setCapexList] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [filteredCapex, setFilteredCapex] = React.useState([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState('success');
  const navigate = useNavigate();

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'nomCapex', headerName: 'Capex Name', width: 220 },
    {
      field: 'budgetTotal',
      headerName: 'Total Budget',
      width: 160,
      renderCell: (params) => `${params.value?.toLocaleString('en-GB')}`,
    },
    {
      field: 'budgetRestant',
      headerName: 'Remaining Budget',
      width: 160,
      renderCell: (params) => `${params.value?.toLocaleString('en-GB')}`,
    },
    { field: 'devis', headerName: 'Currency', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => navigate(`/settings/capex/edit/${params.row.id}`)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteClick(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  React.useEffect(() => {
    const fetchCapex = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5056/api/capex", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data.sort((a, b) => b.id - a.id);
        setCapexList(data);
        setFilteredCapex(data);
      } catch (err) {
        setError("Error loading Capex");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCapex();
  }, []);

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchText(value);
    const filtered = capexList.filter(cap =>
      Object.values(cap).some(field =>
        String(field).toLowerCase().includes(value)
      )
    );
    setFilteredCapex(filtered);
  };

  const handleAddClick = () => navigate('/settings/capex/add');

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5056/api/capex/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCapexList(prev => prev.filter(cap => cap.id !== deleteId));
        setFilteredCapex(prev => prev.filter(cap => cap.id !== deleteId));
        setSnackbarMessage("Capex deleted successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || 'Deletion failed');
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setOpenDialog(false);
      setDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenDialog(false);
    setDeleteId(null);
  };

  if (loading) return <div>Loading Capex...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Sidebar initialPath="/settings/capex">
      <Box m="30px">
        <Header title="Capex Management" subtitle="List of Capex" />
        <Box mt="25px" height="55vh">
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              variant="outlined"
              placeholder="Search..."
              value={searchText}
              onChange={handleSearch}
              fullWidth
            />
            <Button variant="contained" onClick={handleAddClick}>
              Add Capex
            </Button>
          </Box>

          <DataGrid
            rows={filteredCapex}
            columns={columns}
            loading={loading}
            pageSize={5}
            rowsPerPageOptions={[5]}
            getRowId={(row) => row.id}
            components={{ Toolbar: GridToolbar }}
          />

          <Dialog open={openDialog} onClose={handleCancelDelete}>
            <DialogTitle>Delete this Capex?</DialogTitle>
            <DialogActions>
              <Button onClick={handleCancelDelete}>Cancel</Button>
              <Button onClick={handleConfirmDelete} color="error">Delete</Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Sidebar>
  );
}
