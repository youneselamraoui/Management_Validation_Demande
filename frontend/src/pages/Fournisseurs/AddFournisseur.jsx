import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

export default function AddFournisseur() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    contact: "",
    adresse: "",
    tel: "", 
    active: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5056/api/fournisseurs",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSnackbarMessage("Fournisseur ajouté avec succès");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/settings/fournisseurs"), 1500);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Erreur lors de l'ajout");
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
            Ajouter un fournisseur
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
              label="Contact"
              name="contact"
              type="email"
              value={formData.contact}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              required
              fullWidth
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
