import React, { useState, useEffect } from "react";
import {
  Container, Paper, Typography, TextField,
  Button, Snackbar, Alert, Box, MenuItem,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

const DEVISES = ["MAD", "EUR", "USD", "GBP", "SAR", "AED"];

export default function EditTauxChange() {
  const { id } = useParams();
  const [devisSource, setDevisSource] = useState("");
  const [devisCible, setDevisCible] = useState("");
  const [taux, setTaux] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTaux = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5056/api/tauxchange/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setDevisSource(data.devisSource);
        setDevisCible(data.devisCible);
        setTaux(data.taux);
      } catch (err) {
        setSnackbarMessage("Erreur chargement taux");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTaux();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5056/api/tauxchange/${id}`,
        {
          devisSource,
          devisCible,
          taux: parseFloat(taux),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbarMessage("Taux modifié avec succès");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/settings/taux-change"), 1500);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Erreur lors de la modification");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <Sidebar initialPath="/settings/taux-change">
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Modifier Taux de Change
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