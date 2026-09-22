import {
  Box, Typography, Card, CardContent, Button,
  Chip, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Table, TableBody, TableCell,
  TableHead, TableRow, TextField
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [infoDemande, setInfoDemande] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);

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
      console.error("Error loading requests", err);
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    if (!loading) fetchDemandes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const rolesChefLike = ["chef", "achat2", "finance", "directeur", "emea", "admin"];
  const canValidateChef = rolesChefLike.includes(role);

  // ── original logic unchanged ──
  const handleAction = (id, action) => {
    setSelectedId(id);
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
      setSnackbar({ open: true, message: "Information request sent to requester ℹ️", severity: "info" });
      setInfoOpen(false); setInfoDemande(null); setInfoMessage("");
      fetchDemandes();
    } catch (err) {
      const msg = err?.response?.data?.message || "Error requesting information";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally { setInfoLoading(false); }
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
        message: actionType === "valider" ? "Request approved ✅" : "Request rejected ❌",
        severity: actionType === "valider" ? "success" : "error"
      });
      fetchDemandes();
    } catch (err) {
      console.error("Error updating status", err);
      const msg = err?.response?.data?.message || "Error performing action";
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
          Manager Approval — Pending Requests
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

        {/* ─── Cards ─────────────────────────────────────────────────── */}
        {demandes.map((demande) => {
          const capex  = capexList.find(c => c.id === demande.capexId);
          const total  = getTotal(demande.details);
          const devise = getDevise(demande.details);

          return (
            <Card key={demande.id} sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
              <CardContent>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>

                  {/* Request info */}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Request #{demande.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <PersonIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      <strong>{demande.utilisateur?.nom || "Unknown"}</strong> ({demande.utilisateur?.role || "—"})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <CalendarMonthIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      {demande.createdAt
                        ? new Date(demande.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
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
                          Remaining: {capex.budgetRestant.toLocaleString("en-GB")} {capex.devis}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Total */}
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">Quote total</Typography>
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {total} {devise}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => setSelectedDemande(demande)}
                    >
                      View Details
                    </Button>
                  </Box>

                  {/* Actions — manager-like (chef, achat2, finance, directeur) */}
                  {canValidateChef && (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAction(demande.id, "valider")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleAction(demande.id, "refuser")}
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
                  )}
                </Box>

                {/* Items table */}
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 1.5 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell><strong>Item</strong></TableCell>
                        <TableCell align="right"><strong>Qty</strong></TableCell>
                        <TableCell align="right"><strong>Supplier</strong></TableCell>
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

        {/* ─── Info Request Dialog ── */}
        <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>ℹ️ Request Additional Information</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Your message will be sent to the requester <strong>{infoDemande?.utilisateur?.nom || ""}</strong> and the request will move to “Awaiting additional information” until they respond.
            </Typography>
            <TextField
              label="Message to requester *"
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              fullWidth
              multiline
              rows={4}
              size="small"
              placeholder="E.g.: Please clarify the desired supplier / attach a quote..."
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setInfoOpen(false)} variant="outlined">Cancel</Button>
            <Button onClick={handleSendInfo} variant="contained" sx={{ bgcolor: "#ff9800", "&:hover": { bgcolor: "#ef6c00" } }} disabled={!infoMessage.trim() || infoLoading}>
              {infoLoading ? <CircularProgress size={20} color="inherit" /> : "Send"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Confirmation Dialog ── */}
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
              {LoadingConfirmer ? <CircularProgress size={20} color="inherit" /> : "Confirm"}
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
