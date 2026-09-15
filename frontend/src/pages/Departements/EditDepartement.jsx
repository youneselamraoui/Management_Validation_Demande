import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

export default function EditDepartement() {
  const { id } = useParams(); // récupère l'ID depuis l'URL
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  // Charger le département existant
  useEffect(() => {
    const fetchDepartement = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5056/api/departements/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNom(response.data.nom);
      } catch (err) {
        setSnackbarMessage("Erreur chargement département");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartement();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5056/api/departements/${id}`,
        { nom },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbarMessage("Département modifié avec succès");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/settings/departements"), 1500);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Erreur lors de la modification");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <Sidebar initialPath="/settings/departements">
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Modifier Département
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Nom du département"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Enregistrer
            </Button>
            <Button
              variant="outlined"
              sx={{ mt: 2, ml: 2 }}
              onClick={() => navigate("/settings/departements")}
            >
              Annuler
            </Button>
          </form>
        </Paper>

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
      </Container>
    </Sidebar>
  );
}
