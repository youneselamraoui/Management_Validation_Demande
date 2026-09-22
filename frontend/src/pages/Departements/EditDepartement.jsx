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
  const { id } = useParams(); // get ID from URL
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  // Load existing department
  useEffect(() => {
    const fetchDepartement = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5056/api/departements/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNom(response.data.nom);
      } catch (err) {
        setSnackbarMessage("Error loading department");
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
        setSnackbarMessage("Department updated successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/settings/departements"), 1500);
      }
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Error updating department");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Sidebar initialPath="/settings/departements">
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Edit Department
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Department Name"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Save
            </Button>
            <Button
              variant="outlined"
              sx={{ mt: 2, ml: 2 }}
              onClick={() => navigate("/settings/departements")}
            >
              Cancel
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
