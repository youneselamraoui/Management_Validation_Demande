import {
  Box, Typography, Card, CardContent, Button,
  Chip, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Divider, Table, TableBody, TableCell,
  TableHead, TableRow, TextField
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import DetailsDemande from "../components/DetailsDemande";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const ValidationAchat2 = () => {
  const [demandes, setDemandes]     = useState([]);
  const [capexList, setCapexList]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [commentaire, setCommentaire] = useState("");
  const [actionType, setActionType] = useState(""); 
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar]     = useState({ open: false, message: "", severity: "success" });
  const [LaodingConfirmer, setLoadingConfirmer] = useState(false);
  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      try {
        const [resDemandes, resCapex] = await Promise.all([
          axios.get("http://localhost:5056/api/demandes/achat2", { headers }),
          axios.get("http://localhost:5056/api/capex", { headers }),
        ]);
        setDemandes(resDemandes.data);
        setCapexList(resCapex.data);
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: "Erreur chargement demandes", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = (demande, action) => {
    setSelected(demande);
    setActionType(action);
    setCommentaire("");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setLoadingConfirmer(true);
      await axios.put(
        `http://localhost:5056/api/demandes/${selected.id}/statut`,
           { action: actionType, commentaire: commentaire },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );

      setDemandes(prev => prev.filter(d => d.id !== selected.id));
      setSnackbar({
        open: true,
        message: actionType === "valider" ? "Demande validée ✅" : "Demande refusée ❌",
        severity: actionType === "valider" ? "success" : "error"
      });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur lors de l'action", severity: "error" });
    } finally {
      setConfirmOpen(false);
      setSelected(null);
      setSelectedDemande(null);
      setLoadingConfirmer(false);
    }
  };

  const getTotal = (details) => {
    return details?.reduce((sum, d) => {
      const prix = parseFloat(d.prix);
      return sum + (isNaN(prix) ? 0 : prix * d.quantite);
    }, 0).toFixed(2);
  };

  if (loading) return (
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
          Validation Achat 2
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

        {/* ─── Cards des demandes ───────────────────────────────────────── */}
        {demandes.map((demande) => {
          const capex = capexList.find(c => c.id === demande.capexId);
          const total = getTotal(demande.details);

          return (
            <Card key={demande.id} sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>

                  {/* ── Infos demande ── */}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Demande #{demande.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {demande.utilisateur?.nom} • {demande.utilisateur?.departement}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {demande.createdAt
                        ? new Date(demande.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                        : "—"}
                    </Typography>
                    <Chip label={demande.statut} color="warning" size="small" sx={{ mt: 0.5 }} />
                  </Box>

                  {/* ── Capex ── */}
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

                  {/* ── Total ── */}
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">Total devis</Typography>
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {total}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      {demande.cheminDevis && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={() => window.open(`http://localhost:5056${demande.cheminDevis}`, "_blank")}
                        >
                          Devis PDF
                        </Button>
                      )}
                        <Button
                        variant="outlined"
                        onClick={() => setSelectedDemande(demande)}
                    >
                        Voir détails
                    </Button>
                  </Box>
                  </Box>

                  {/* ── Actions ── */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleAction(demande, "valider")}
                    >
                      Valider
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleAction(demande, "refuser")}
                    >
                      Refuser
                    </Button>
                  </Box>
                </Box>

                {/* ── Articles résumé ── */}
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 1.5 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell><strong>Article</strong></TableCell>
                        <TableCell align="right"><strong>Qté</strong></TableCell>
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

        {/* ─── Dialog Confirmation ──────────────────────────────────────── */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>
            {actionType === "valider" ? "✅ Confirmer la validation" : "❌ Confirmer le refus"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {actionType === "valider"
                ? "La demande sera envoyée "
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
              {LaodingConfirmer ? <CircularProgress size={20} color="inherit" />: "Confirmer"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Sidebar>
  );
};

export default ValidationAchat2;