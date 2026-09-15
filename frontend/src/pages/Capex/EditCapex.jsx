import React, { useState, useEffect } from "react";
import {
  Container, Paper, Typography, TextField,
  Button, Snackbar, Alert, Box, MenuItem
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

export default function EditCapex() {
  const { id } = useParams();
  const [nomCapex, setNomCapex] = useState("");
  const [budgetTotal, setBudgetTotal] = useState("");
  const [budgetRestant, setBudgetRestant] = useState("");
  const [devis, setDevis] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCapex = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5056/api/capex/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setNomCapex(data.nomCapex);
        setBudgetTotal(data.budgetTotal);
        setBudgetRestant(data.budgetRestant);
        setDevis(data.devis || "");
      } catch (err) {
        setSnackbarMessage("Erreur chargement Capex");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCapex();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5056/api/capex/${id}`,
        {
          nomCapex,
          budgetTotal: parseFloat(budgetTotal),
          budgetRestant: parseFloat(budgetRestant),
          devis: devis || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbarMessage("Capex modifié avec succès");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/settings/capex"), 1500);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Erreur lors de la modification");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <Sidebar initialPath="/settings/capex">
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Modifier Capex
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Nom du Capex"
              value={nomCapex}
              onChange={(e) => setNomCapex(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Budget Total"
              type="number"
              value={budgetTotal}
              onChange={(e) => setBudgetTotal(e.target.value)}
              fullWidth
              required
              margin="normal"
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
              label="Budget Restant"
              type="number"
              value={budgetRestant}
              onChange={(e) => setBudgetRestant(e.target.value)}
              fullWidth
              required
              margin="normal"
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
            select
            label="Devise"
            value={devis}
            onChange={(e) => setDevis(e.target.value)}
            fullWidth
            required
            margin="normal"
            >
            <MenuItem value="MAD">MAD - Dirham Marocain</MenuItem>
            <MenuItem value="EUR">EUR - Euro</MenuItem>
            <MenuItem value="USD">USD - Dollar Américain</MenuItem>
            <MenuItem value="GBP">GBP - Livre Sterling</MenuItem>
            <MenuItem value="SAR">SAR - Riyal Saoudien</MenuItem>
            <MenuItem value="AED">AED - Dirham Émirati</MenuItem>
            </TextField>
            <Box sx={{ mt: 2 }}>
              <Button type="submit" variant="contained">
                Enregistrer
              </Button>
              <Button
                variant="outlined"
                sx={{ ml: 2 }}
                onClick={() => navigate("/settings/capex")}
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