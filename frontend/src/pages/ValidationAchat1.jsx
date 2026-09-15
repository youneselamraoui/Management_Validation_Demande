import {
  Box, Typography, Card, CardContent, Chip,
  Button, Divider, Alert, Snackbar
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import DetailsDemande from "../components/DetailsDemande";
import { useNavigate } from "react-router-dom";

const ValidationAchat1 = () => {
  const [demandes, setDemandes]         = useState([]);
  const [snackbar, setSnackbar]         = useState({ open: false, message: "", severity: "success" });
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [Loading, setLoding] = useState(false);
  const navigate = useNavigate();

  const { user, loading } = useAuth();

  const resolvedUser = user ?? (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })();

  // const role  = (resolvedUser?.role ?? "").toLowerCase().trim();
  const token = localStorage.getItem("token");
  const tokenRef = useRef(token);

  const fetchDemandes = async () => {
    try {
      setLoding(true);
      const res = await axios.get("http://localhost:5056/api/demandes/achat1", {
        headers: { Authorization: `Bearer ${tokenRef.current}` }
      });
      setDemandes(res.data);
    } catch (err) {
      console.error("Erreur chargement demandes", err);
    } finally { setLoding(false); }
  };

  useEffect(() => {
    if (!loading) fetchDemandes();
  }, [loading]);

  if (loading) return (
    <Sidebar>
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={60} />
      </Box>
    </Sidebar>
  );
  if (!resolvedUser) return null;

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
           Service Achat — Recherche Fournisseurs
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={3}>
          Demandes validées en attente de devis
        </Typography>

        {demandes.length === 0 ? (
          <Alert severity="info">Aucune demande en attente de devis.</Alert>
        ) : (
          demandes.map((demande) => (
            <Card key={demande.id} sx={{ mb: 3 }}>
              <CardContent>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Demande #{demande.id}
                  </Typography>
                  <Chip label="En attente de devis" color="warning" size="small" />
                </Box>

                {/* Info */}
                <Box sx={{ display: "flex", gap: 3, mb: 2, color: "text.secondary", flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="body2">
                      <strong>{demande.utilisateur?.nom || "Inconnu"}</strong>
                      {" "}({demande.utilisateur?.role || "—"})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CalendarMonthIcon fontSize="small" />
                    <Typography variant="body2">
                      {demande.createdAt
                        ? new Date(demande.createdAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </Typography>
                  </Box>
                  {demande.utilisateur?.departement && (
                    <Typography variant="body2">
                      📁 {demande.utilisateur.departement}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                    <Typography variant="body2" color="success.main">
                      {demande.utilisateur?.chefId ? "Validée par chef" : "Soumise directement"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Articles */}
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Articles à rechercher :
                </Typography>
                {demande.details?.map((d, i) => (
                  <Box key={i} sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    bgcolor: "#f8fafc",
                    px: 2, py: 1,
                    borderRadius: 2,
                    mb: 1
                  }}>
                    <Typography variant="body2">{d.article}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quantité : {d.quantite}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                {/* Boutons */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SearchIcon />}
                      onClick={() => navigate(`/recherche-devis/${demande.id}`)}
                    >
                      Commencer la recherche
                    </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedDemande(demande)}
                  >
                    Voir détails
                  </Button>
                </Box>

              </CardContent>
            </Card>
          ))
        )}

        {/* Modal détails */}
        <DetailsDemande
          open={Boolean(selectedDemande)}
          onClose={() => setSelectedDemande(null)}
          demande={selectedDemande}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Sidebar>
  );
};

export default ValidationAchat1;