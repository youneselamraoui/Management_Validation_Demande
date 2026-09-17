import {
  Box, Typography, Card, CardContent, Button,
  Chip, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Table, TableBody, TableCell,
  TableHead, TableRow, TextField
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import DetailsDemande from "../components/DetailsDemande";

const ValidationChef = () => {
  const [demandes, setDemandes]       = useState([]);
  const [capexList, setCapexList]     = useState([]);
  const [snackbar, setSnackbar]       = useState({ open: false, message: "", severity: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId]   = useState(null);
  const [actionType, setActionType]   = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [LoadingConfirmer, setLoadingConfirmer] = useState(false);
  const [Loading, setLoading2]        = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);

  const { user, loading } = useAuth();
  const resolvedUser = user ?? (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })();
  const role  = (resolvedUser?.role ?? "").toLowerCase().trim();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDemandes = async () => {
    try {
      setLoading2(true);
      const [res, resCapex] = await Promise.all([
        axios.get("http://localhost:5056/api/demandes/chef", { headers }),
        axios.get("http://localhost:5056/api/capex",         { headers }),
      ]);
      setDemandes(res.data);
      setCapexList(resCapex.data);
    } catch (err) {
      console.error("Erreur chargement demandes", err);
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    if (!loading) fetchDemandes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const rolesChefLike = ["chef", "achat2", "finance", "directeur", "admin"];
  const canValidateChef = rolesChefLike.includes(role);

  // ── logique originale inchangée ──
  const handleAction = (id, action) => {
    setSelectedId(id);
    setActionType(action);
    setCommentaire("");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setLoadingConfirmer(true);
      await axios.put(
        `http://localhost:5056/api/demandes/${selectedId}/statut`,
        { action: actionType, commentaire: commentaire },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
      setSnackbar({
        open: true,
        message: actionType === "valider" ? "Demande validée ✅" : "Demande refusée ❌",
        severity: actionType === "valider" ? "success" : "error"
      });
      fetchDemandes();
    } catch (err) {
      console.error("Erreur mise à jour statut", err);
      const msg = err?.response?.data?.message || "Erreur lors de l'action";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setConfirmOpen(false);
      setLoadingConfirmer(false);
      setSelectedId(null);
      setSelectedDemande(null);
    }
  };

  const getTotal = (details) =>
    details?.reduce((sum, d) => {
      const prix = parseFloat(d.prix);
      return sum + (isNaN(prix) ? 0 : prix * d.quantite);
    }, 0).toFixed(2);

  const getDevise = (details) => details?.[0]?.devis ?? "—";

  if (loading || Loading) return (
    <Sidebar>
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={60} />
      </Box>
    </Sidebar>
  );

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Validation Chef — Demandes en attente
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {demandes.length} demande(s) en attente de validation
        </Typography>

        {demandes.length === 0 && (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Aucune demande en attente
            </Typography>
          </Box>
        )}

        {/* ─── Cards ─────────────────────────────────────────────────── */}
        {demandes.map((demande) => {
          const capex  = capexList.find(c => c.id === demande.capexId);
          const total  = getTotal(demande.details);
          const devise = getDevise(demande.details);

          return (
            <Card key={demande.id} sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
              <CardContent>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>

                  {/* Infos demande */}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Demande #{demande.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <PersonIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      <strong>{demande.utilisateur?.nom || "Inconnu"}</strong> ({demande.utilisateur?.role || "—"})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <CalendarMonthIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      {demande.createdAt
                        ? new Date(demande.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                        : "—"}
                    </Typography>
                    <Chip label={demande.statut || "En attente validation chef"} color="warning" size="small" sx={{ mt: 0.5 }} />
                  </Box>

                  {/* Capex */}
                  {capex && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0f7ff", borderRadius: 2, border: "1px solid #1976d2" }}>
                      <AccountBalanceWalletIcon color="primary" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Capex</Typography>
                        <Typography variant="body2" fontWeight={700}>{capex.nomCapex}</Typography>
                        <Typography variant="caption" color="primary">
                          Restant : {capex.budgetRestant.toLocaleString("fr-FR")} {capex.devis}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Total */}
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">Total devis</Typography>
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {total} {devise}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => setSelectedDemande(demande)}
                    >
                      Voir détails
                    </Button>
                  </Box>

                  {/* Actions — chef au sens large (chef, achat2, finance, directeur) */}
                  {canValidateChef && (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAction(demande.id, "valider")}
                      >
                        Valider
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleAction(demande.id, "refuser")}
                      >
                        Refuser
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Tableau articles */}
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 1.5 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell><strong>Article</strong></TableCell>
                        <TableCell align="right"><strong>Qté</strong></TableCell>
                        <TableCell align="right"><strong>Fournisseur</strong></TableCell>
                        <TableCell align="right"><strong>Prix unitaire</strong></TableCell>
                        <TableCell align="right"><strong>Devise</strong></TableCell>
                        <TableCell align="right"><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demande.details?.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>{d.article}</TableCell>
                          <TableCell align="right">{d.quantite}</TableCell>
                          <TableCell align="right">{d.fournisseur?.nom ?? "—"}</TableCell>
                          <TableCell align="right">{d.prix ?? "—"}</TableCell>
                          <TableCell align="right">{d.devis ?? "—"}</TableCell>
                          <TableCell align="right">
                            {d.prix ? (d.prix * d.quantite).toFixed(2) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

              </CardContent>
            </Card>
          );
        })}

        <DetailsDemande
          open={Boolean(selectedDemande)}
          onClose={() => setSelectedDemande(null)}
          demande={selectedDemande}
        />

        {/* ─── Dialog Confirmation ── */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>
            {actionType === "valider" ? "✅ Confirmer la validation" : "❌ Confirmer le refus"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {actionType === "valider"
                ? "La demande sera envoyée"
                : "La demande sera marquée comme refusée."}
            </Typography>
            {actionType === "refuser" && (
              <TextField
                label="Raison du refus (optionnel)"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setConfirmOpen(false)} variant="outlined">Annuler</Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              color={actionType === "valider" ? "success" : "error"}
            >
              {LoadingConfirmer ? <CircularProgress size={20} color="inherit" /> : "Confirmer"}
            </Button>
          </DialogActions>
        </Dialog>

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

export default ValidationChef;