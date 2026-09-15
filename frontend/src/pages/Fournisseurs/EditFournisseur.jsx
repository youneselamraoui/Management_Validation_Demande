import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

export default function EditFournisseur() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();
  const { id } = useParams(); // récupère l'id depuis l'URL

  const [formData, setFormData] = useState({
    nom: "",
    contact: "",
    adresse: "",
    tel: "", 
    active: true,
  });

  // Charger les données existantes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5056/api/fournisseurs/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFormData(response.data);
      } catch (err) {
        setSnackbarMessage("Erreur lors du chargement du fournisseur");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        console.log(err);
      }
    };
    fetchData();
  }, [id]);

  // Soumettre les modifications
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5056/api/fournisseurs/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbarMessage("Fournisseur modifié avec succès");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/settings/fournisseurs"), 1500);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Erreur lors de la modification");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Sidebar initialPath="/settings/fournisseurs">
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Éditer fournisseur
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Nom du fournisseur"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Email du contact"
              name="contact"
              type="email"
              value={formData.contact}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Téléphone"
              name="tel"
              value={formData.tel}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                />
              }
              label="Actif"
            />

            {/* Boutons en bas */}
            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button type="submit" variant="contained">
                Enregistrer
              </Button>
              <Button
                variant="outlined"
                sx={{ ml: 2 }}
                onClick={() => navigate("/settings/fournisseurs")}
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
