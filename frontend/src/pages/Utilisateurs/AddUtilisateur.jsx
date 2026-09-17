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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";

function AddUtilisateur() {
  const [departements, setDepartements] = useState([]);
  const [chefs, setChefs] = useState([]);
   const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    motDePasse: "",
    role: "employe",
    departementId: "",
    chefId: null,
    active: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    axios.get("http://localhost:5056/api/departements")
      .then(res => setDepartements(res.data));

    axios.get("http://localhost:5056/api/utilisateurs/chefs")
      .then(res => setChefs(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5056/api/utilisateurs", formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(() => setSnackbar({ open: true, message: "Utilisateur ajouté avec succès !", severity: "success" }))
    .catch(() => setSnackbar({ open: true, message: "Erreur lors de l'ajout", severity: "error" }));
    setTimeout(() => navigate("/settings/utilisateurs"), 1500);
  };


  return (
    <Sidebar initialPath="/settings/utilisateurs">
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Ajouter un utilisateur
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          
          <TextField label="Nom" name="nom" value={formData.nom} onChange={handleChange} required />
          <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <TextField label="Mot de passe" name="motDePasse" type="password" value={formData.motDePasse} onChange={handleChange} required />

          <FormControl fullWidth>
            <InputLabel>Rôle</InputLabel>
            <Select label="Rôle" name="role" value={formData.role} onChange={handleChange}>
              <MenuItem value="employe">Employé</MenuItem>
              <MenuItem value="chef">Chef</MenuItem>
              <MenuItem value="achat1">Achat 1</MenuItem>
              <MenuItem value="achat2">Achat 2</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="directeur">Directeur</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Département</InputLabel>
            <Select label="Département" name="departementId" value={formData.departementId} onChange={handleChange} required>
              {departements.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.nom}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Chef (chef / achat2 / finance / directeur)</InputLabel>
            <Select label="Chef (chef / achat2 / finance / directeur)" name="chefId" value={formData.chefId} onChange={handleChange}>
              <MenuItem value="">-- Aucun chef --</MenuItem>
              {chefs.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.nom} {c.role ? `(${c.role})` : ""}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Checkbox checked={formData.active} onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))} />}
            label="Actif"
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
          >
            Enregistrer
          </Button>
          {/* <Button
            variant="outlined"
            sx={{ mt: 2, ml: 2 }}
            onClick={() => navigate("/settings/utilisateurs")}
          >
            Annuler
          </Button> */}
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
    </Sidebar>
  );
}

export default AddUtilisateur;
