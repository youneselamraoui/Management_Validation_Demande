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
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [infoDemande, setInfoDemande] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
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
        setSnackbar({ open: true, message: "Error loading requests", severity: "error" });
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
  const handleInfoRequest = (demande) => {
    setInfoDemande(demande);
    setInfoMessage("");
    setInfoOpen(true);
  };
  const handleSendInfo = async () => {
    if (!infoMessage.trim()) return;
    try {
      setInfoLoading(true);
      await axios.post(`http://localhost:5056/api/demandes/${infoDemande.id}/request-info`,
        { message: infoMessage.trim() },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
      setSnackbar({ open: true, message: "Information request sent ℹ️", severity: "info" });
      setInfoOpen(false); setInfoDemande(null); setInfoMessage("");
      setDemandes(prev => prev.filter(d => d.id !== infoDemande.id));
    } catch (err) {
      setSnackbar({ open: true, message: err?.response?.data?.message || "Error", severity: "error" });
    } finally { setInfoLoading(false); }
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
        message: actionType === "valider" ? "Request approved ✅" : "Request rejected ❌",
        severity: actionType === "valider" ? "success" : "error"
      });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error performing action", severity: "error" });
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
          Purchasing Approval 2
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {demandes.length} request(s) pending approval
        </Typography>

        {demandes.length === 0 && (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No pending requests
            </Typography>
          </Box>
        )}

        {/* ─── Request Cards ───────────────────────────────────────── */}
        {demandes.map((demande) => {
          const capex = capexList.find(c => c.id === demande.capexId);
          const total = getTotal(demande.details);

          return (
            <Card key={demande.id} sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>

                  {/* ── Request info ── */}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Request #{demande.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {demande.utilisateur?.nom} • {demande.utilisateur?.departement}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {demande.createdAt
                        ? new Date(demande.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
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
                          Remaining: {capex.budgetRestant.toLocaleString("en-GB")} {capex.devis}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* ── Total ── */}
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">Quote total</Typography>
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {total}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {[1,2,3].map(slot => {
                        const chemin = slot === 1 ? demande.cheminDevis : slot === 2 ? demande.cheminDevis2 : demande.cheminDevis3;
                        if (!chemin) return null;
                        return (
                          <Button
                            key={slot}
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() => window.open(`http://localhost:5056${chemin}`, "_blank")}
                          >
                            Quote {slot}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outlined"
                        onClick={() => setSelectedDemande(demande)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Box>

                  {/* ── Actions ── */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleAction(demande, "valider")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleAction(demande, "refuser")}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="contained"
                      sx={{ bgcolor: "#ff9800", "&:hover": { bgcolor: "#ef6c00" } }}
                      startIcon={<HelpOutlineIcon />}
                      onClick={() => handleInfoRequest(demande)}
                    >
                      Request Info
                    </Button>
                  </Box>
                </Box>

                {/* ── Items summary ── */}
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 1.5 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell><strong>Item</strong></TableCell>
                        <TableCell align="right"><strong>Qty</strong></TableCell>
                        <TableCell align="right"><strong>Unit Price</strong></TableCell>
                        <TableCell align="right"><strong>Currency</strong></TableCell>
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

        <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>ℹ️ Request Information</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Message for <strong>{infoDemande?.utilisateur?.nom || ""}</strong> — the request will remain pending until they respond.
            </Typography>
            <TextField label="Message *" value={infoMessage} onChange={(e) => setInfoMessage(e.target.value)} fullWidth multiline rows={4} size="small" placeholder="E.g.: Please clarify..." autoFocus />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setInfoOpen(false)} variant="outlined">Cancel</Button>
            <Button onClick={handleSendInfo} variant="contained" sx={{ bgcolor: "#ff9800", "&:hover": { bgcolor: "#ef6c00" } }} disabled={!infoMessage.trim() || infoLoading}>{infoLoading ? <CircularProgress size={20} color="inherit" /> : "Send"}</Button>
          </DialogActions>
        </Dialog>

        {/* ─── Confirmation Dialog ──────────────────────────────────────── */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>
            {actionType === "valider" ? "✅ Confirm Approval" : "❌ Confirm Rejection"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {actionType === "valider"
                ? "The request will be forwarded"
                : "The request will be marked as rejected."}
            </Typography>
           {actionType === "refuser" && (
            <TextField
              label="Rejection reason (optional)"
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
            <Button onClick={() => setConfirmOpen(false)} variant="outlined">Cancel</Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              color={actionType === "valider" ? "success" : "error"}
            >
              {LaodingConfirmer ? <CircularProgress size={20} color="inherit" />: "Confirm"}
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
