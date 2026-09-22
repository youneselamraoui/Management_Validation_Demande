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
  InputAdornment,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function ChangePassword() {
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const token = localStorage.getItem("token");
  const userId = user?.id;

  const [formData, setFormData] = useState({
    ancienMotDePasse: "",
    nouveauMotDePasse: "",
    confirmation: "",
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .put(
        `http://localhost:5056/api/utilisateurs/${userId}/change-password`,
        {
          ancienMotDePasse: formData.ancienMotDePasse,
          nouveauMotDePasse: formData.nouveauMotDePasse,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setSnackbar({
          open: true,
          message: "Password changed successfully!",
          severity: "success",
        });
        setTimeout(() => navigate(-1), 1500);
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message || "Current password is incorrect.";
        setSnackbar({ open: true, message: msg, severity: "error" });
      });
  };

  return (
    <Sidebar initialPath="/settings/utilisateurs">
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Change Password
          </Typography>

          {user && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Account: <strong>{user.nom}</strong> — {user.email}
            </Typography>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Current password */}
            <TextField
              label="Current Password"
              name="ancienMotDePasse"
              type={showOld ? "text" : "password"}
              value={formData.ancienMotDePasse}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowOld((v) => !v)} edge="end">
                      {showOld ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* New password */}
            <TextField
              fullWidth
              label="New Password"
              name="nouveauMotDePasse"
              type={showNew ? "text" : "password"}
              value={formData.nouveauMotDePasse}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNew((v) => !v)} edge="end">
                      {showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirmation */}
            <TextField
              label="Confirm New Password"
              name="confirmation"
              type={showConf ? "text" : "password"}
              value={formData.confirmation}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConf((v) => !v)} edge="end">
                      {showConf ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </Box>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Container>
    </Sidebar>
  );
}

export default ChangePassword;
