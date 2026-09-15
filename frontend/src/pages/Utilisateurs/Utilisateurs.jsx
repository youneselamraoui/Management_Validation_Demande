import React, { useState, useEffect } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

const Header = ({ title, subtitle }) => (
  <Box mb="30px">
    <Typography variant="h5" fontWeight="bold">{title}</Typography>
    <Typography variant="body2" color="textSecondary">{subtitle}</Typography>
  </Box>
);

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "nom", headerName: "Nom", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "role", headerName: "Rôle", width: 150 },
    { field: "departementNom", headerName: "Département", width: 150 },
    { field: "chefNom", headerName: "Chef", width: 150  },
    { field: "active", headerName: "Actif", width: 100,
      renderCell: (params) => params.value ? "Oui" : "Non"
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => navigate(`/settings/utilisateurs/edit/${params.row.id}`)}
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5056/api/utilisateurs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data.sort((a, b) => b.id - a.id);
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError("Erreur chargement utilisateurs");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchText(value);
    const filtered = users.filter(user =>
      Object.values(user).some(field =>
        String(field).toLowerCase().includes(value)
      )
    );
    setFilteredUsers(filtered);
  };

  const handleAddClick = () => navigate("/settings/utilisateurs/add");

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`http://localhost:5056/api/utilisateurs/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(prev => prev.filter(user => user.id !== deleteId));
        setFilteredUsers(prev => prev.filter(user => user.id !== deleteId));
        setSnackbarMessage("Utilisateur supprimé avec succès");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Échec de la suppression");
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

  if (loading) return <div>Chargement des utilisateurs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Sidebar initialPath="/settings/utilisateurs">
      <Box m="30px">
        <Header title="Gestion des Utilisateurs" subtitle="Liste des utilisateurs" />
        <Box mt="25px" height="55vh">
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              variant="outlined"
              placeholder="Rechercher..."
              value={searchText}
              onChange={handleSearch}
              fullWidth
            />
            <Button variant="contained" onClick={handleAddClick}>
              Ajouter Utilisateur
            </Button>
          </Box>

          <DataGrid
            rows={filteredUsers}
            columns={columns}
            loading={loading}
            pageSize={5}
            rowsPerPageOptions={[5]}
            getRowId={(row) => row.id}
            components={{ Toolbar: GridToolbar }}
          />

          <Dialog open={openDialog} onClose={handleCancelDelete}>
            <DialogTitle>Supprimer cet utilisateur ?</DialogTitle>
            <DialogActions>
              <Button onClick={handleCancelDelete}>Annuler</Button>
              <Button onClick={handleConfirmDelete} color="error">Supprimer</Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert severity={snackbarSeverity} sx={{ width: "100%" }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Sidebar>
  );
}
