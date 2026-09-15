import { useState } from "react";
import axios from "axios";
import eci_logo from "../assets/eci_logo.png";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Paper, Typography, TextField, Button, Avatar
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
   const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5056/api/auth/login", {
        Email: email,
        MotDePasse: password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user)); // stocker l'utilisateur
      
      navigate("/creer-demande");
    } catch (err) {
      setError("Email ou mot de passe incorrect ou compte inactif");
      console.error("Erreur de connexion :", err);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg,#e3f2fd,#f5f7fa)" }}>
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ padding: 5, borderRadius: 4, textAlign: "center" }}>
          <Box sx={{ mb: 2 }}>
            <img src={eci_logo} alt="ECI Logo" style={{ height: 80 }} />
          </Box>
          <Avatar sx={{ bgcolor: "#1976d2", margin: "auto", mb: 2 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">Purchasing</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Connectez-vous pour gérer vos demandes
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Mot de passe" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.3, fontWeight: "bold", borderRadius: 2 }}>
              SE CONNECTER
            </Button>
            {error && <Typography color="error" mt={2}>{error}</Typography>}
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
