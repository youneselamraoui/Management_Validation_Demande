import {
  Box, Typography, Card, CardContent, Chip,
  Button, Divider, Alert, Snackbar, CircularProgress
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import DetailsDemande from "../components/DetailsDemande";
import { useNavigate } from "react-router-dom";

const ValidationAchat1 = () => {
  const [demandes, setDemandes]         = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
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
      const [resDemandes, resFournisseurs] = await Promise.all([
        axios.get("http://localhost:5056/api/demandes/achat1", {
          headers: { Authorization: `Bearer ${tokenRef.current}` }
        }),
        axios.get("http://localhost:5056/api/Fournisseurs/actifs", {
          headers: { Authorization: `Bearer ${tokenRef.current}` }
        }).catch(() => ({ data: [] }))
      ]);
      setDemandes(resDemandes.data);
      setFournisseurs(resFournisseurs.data || []);
    } catch (err) {
      console.error("Error loading requests", err);
    } finally { setLoding(false); }
  };

  const getFournisseurNom = (id) => {
    if (!id) return null;
    const f = fournisseurs.find(x => String(x.id) === String(id));
    return f ? f.nom : `Supplier #${id}`;
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
           Purchasing — Supplier Search
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={3}>
          Approved requests awaiting quotes
        </Typography>

        {demandes.length === 0 ? (
          <Alert severity="info">No requests awaiting quotes.</Alert>
        ) : (
          demandes.map((demande) => (
            <Card key={demande.id} sx={{ mb: 3 }}>
              <CardContent>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Request #{demande.id}
                  </Typography>
                  <Chip label="Awaiting quotes" color="warning" size="small" />
                </Box>

                {/* Info */}
                <Box sx={{ display: "flex", gap: 3, mb: 2, color: "text.secondary", flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="body2">
                      <strong>{demande.utilisateur?.nom || "Unknown"}</strong>
                      {" "}({demande.utilisateur?.role || "—"})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CalendarMonthIcon fontSize="small" />
                    <Typography variant="body2">
                      {demande.createdAt
                        ? new Date(demande.createdAt).toLocaleDateString("en-GB")
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
                      {demande.utilisateur?.chefId ? "Approved by manager" : "Submitted directly"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Justification if supplier suggested */}
                {demande.justification && demande.details?.some(d => d.fournisseurId) && (
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: "#e3f2fd", borderRadius: 2, border: "1px solid #90caf9" }}>
                    <Typography variant="caption" fontWeight={700} color="primary">Requester justification:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{demande.justification}</Typography>
                  </Box>
                )}

                {/* Items */}
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Items to search:
                </Typography>
                {demande.details?.map((d, i) => {
                  const hasFournisseur = !!d.fournisseurId;
                  return (
                  <Box key={i} sx={{
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: hasFournisseur ? "#e3f2fd" : "#f8fafc",
                    px: 2, py: 1,
                    borderRadius: 2,
                    mb: 1,
                    border: hasFournisseur ? "1px solid #90caf9" : "1px solid transparent"
                  }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" fontWeight={hasFournisseur ? 600 : 400}>{d.article}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {d.quantite}
                      </Typography>
                    </Box>
                    {hasFournisseur && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <StorefrontIcon fontSize="small" color="info" />
                        <Typography variant="caption" color="info.main" fontWeight={600}>
                          Suggested supplier: {d.fournisseur?.nom || getFournisseurNom(d.fournisseurId)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  );
                })}

                <Divider sx={{ my: 2 }} />

                {/* Buttons */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SearchIcon />}
                      onClick={() => navigate(`/recherche-devis/${demande.id}`)}
                    >
                      Start Search
                    </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedDemande(demande)}
                  >
                    View Details
                  </Button>
                </Box>

              </CardContent>
            </Card>
          ))
        )}

        {/* Details modal */}
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
