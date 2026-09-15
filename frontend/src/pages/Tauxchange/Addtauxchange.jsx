import React, { useState } from "react";
import {
  Container, Paper, Typography, TextField,
  Button, Snackbar, Alert, Box, MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

const DEVISES = ["MAD", "EUR", "USD", "GBP", "SAR", "AED"];

export default function AddTauxChange() {
  const [devisSource, setDevisSource] = useState("");
  const [devisCible, setDevisCible] = useState("");
  const [taux, setTaux] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5056/api/tauxchange",
        {
          devisSource,
          devisCible,
          taux: parseFloat(taux),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbarMessage("Taux ajouté avec succès");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/settings/taux-change"), 1500);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Erreur lors de l'ajout");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Sidebar initialPath="/settings/taux-change">
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Ajouter un Taux de Change
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              select
              label="Devise Source"
              value={devisSource}
              onChange={(e) => setDevisSource(e.target.value)}
              fullWidth
              required
              margin="normal"
            >
              {DEVISES.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Devise Cible"
              value={devisCible}
              onChange={(e) => setDevisCible(e.target.value)}
              fullWidth
              required
              margin="normal"
            >
              {DEVISES.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Taux"
              type="number"
              value={taux}
              onChange={(e) => setTaux(e.target.value)}
              fullWidth
              required
              margin="normal"
              inputProps={{ min: 0, step: "0.0001" }}
            />

            <Box sx={{ mt: 2 }}>
              <Button type="submit" variant="contained">
                Enregistrer
              </Button>
              <Button
                variant="outlined"
                sx={{ ml: 2 }}
                onClick={() => navigate("/settings/taux-change")}
              >
                Annuler
              </Button>
            </Box>
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