import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

export default function AddDepartement() {
  const [nom, setNom] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5056/api/departements",
        { nom },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbarMessage("Département ajouté avec succès");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/settings/departements"), 1500);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Erreur lors de l'ajout");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Sidebar initialPath="/settings/departements">
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Ajouter un Département
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
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 2 }}
            >
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
