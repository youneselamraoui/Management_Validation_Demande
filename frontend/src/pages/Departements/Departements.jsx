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

export default function GestionDepartements() {
  const [departements, setDepartements] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [filteredDepartements, setFilteredDepartements] = React.useState([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState('success');
  const navigate = useNavigate();

  const columns = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'nom', headerName: 'Department Name', width: 250 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => navigate(`/settings/departements/edit/${params.row.id}`)}
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
    const fetchDepartements = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5056/api/departements", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data.sort((a, b) => b.id - a.id);
        setDepartements(data);
        setFilteredDepartements(data);
      } catch (err) {
        setError("Error loading departments");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartements();
  }, []);

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchText(value);
    const filtered = departements.filter(dep =>
      Object.values(dep).some(field =>
        String(field).toLowerCase().includes(value)
      )
    );
    setFilteredDepartements(filtered);
  };

  const handleAddClick = () => navigate('/settings/departements/add');

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5056/api/departements/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDepartements(prev => prev.filter(dep => dep.id !== deleteId));
        setFilteredDepartements(prev => prev.filter(dep => dep.id !== deleteId));
        setSnackbarMessage("Department deleted successfully");
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

  if (loading) return <div>Loading departments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Sidebar initialPath="/settings/departements">
      <Box m="30px">
        <Header title="Department Management" subtitle="List of departments" />
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
              Add Department
            </Button>
          </Box>

          <DataGrid
            rows={filteredDepartements}
            columns={columns}
            loading={loading}
            pageSize={5}
            rowsPerPageOptions={[5]}
            getRowId={(row) => row.id}
            components={{ Toolbar: GridToolbar }}
          />

          <Dialog open={openDialog} onClose={handleCancelDelete}>
            <DialogTitle>Delete this department?</DialogTitle>
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
