import {
  Box, Typography, Card, CardContent, Button, Chip, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const ValidationEMEA = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionType, setActionType] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5056/api/demandes/emea", { headers });
      setDemandes(res.data);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Loading error", severity: "error" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDemandes(); // eslint-disable-next-line
  }, []);

  const handleAction = (d, action) => {
    setSelected(d);
    setActionType(action);
    setCommentaire("");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await axios.put(`http://localhost:5056/api/demandes/${selected.id}/statut`, { action: actionType, commentaire }, { headers: { ...headers, "Content-Type": "application/json" } });
      setSnackbar({ open: true, message: actionType === "valider" ? `Request #${selected.id} approved — PO generated ✅` : "Request rejected ❌", severity: actionType === "valider" ? "success" : "error" });
      setConfirmOpen(false);
      setSelected(null);
      fetchDemandes();
    } catch (err) {
      const msg = err?.response?.data?.message || "Action error";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally { setSubmitting(false); }
  };

  if (loading) return (<Sidebar><Box sx={{ p: 3, display: "flex", justifyContent: "center" }}><CircularProgress /></Box></Sidebar>);

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>EMEA Approval</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>{demandes.length} request(s) pending EMEA approval — SAP file named by Provisional PO</Typography>

        {demandes.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}><CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} /><Typography variant="h6" color="text.secondary">No pending requests</Typography></Box>
        ) : demandes.map((d) => (
          <Card key={d.id} sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Request #{d.id} — Provisional PO: <Chip label={d.provisionalPo || "—"} color="primary" size="small" /></Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleAction(d, "valider")}>Approve</Button>
                  <Button variant="contained" color="error" startIcon={<CancelIcon />} onClick={() => handleAction(d, "refuser")}>Reject</Button>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ p: 1.5, bgcolor: "#f0f7ff", borderRadius: 2, border: "1px solid #1976d2", mb: 1.5 }}>
                <Typography variant="caption" fontWeight={700} color="primary">Purchasing1 Comment (required):</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{d.commentaireSAP || d.commentaire || "—"}</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PictureAsPdfIcon color="error" />
                <Typography variant="body2" fontWeight={600}>SAP File (PO: {d.provisionalPo || "—"}):</Typography>
                {d.cheminSAP ? (
                  <Button variant="outlined" size="small" onClick={() => window.open(`http://localhost:5056${d.cheminSAP}`, "_blank")}>View SAP File — {d.provisionalPo}.pdf</Button>
                ) : <Typography variant="caption" color="text.secondary">No file</Typography>}
              </Box>
            </CardContent>
          </Card>
        ))}

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{actionType === "valider" ? "✅ Confirm EMEA Approval" : "❌ Confirm EMEA Rejection"}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>{actionType === "valider" ? `Request #${selected?.id} will be approved and PO ${selected?.provisionalPo || ""} will be generated automatically .` : "The request will be marked as EMEA Rejected."}</Typography>
            {actionType === "refuser" && <TextField label="Rejection reason (optional)" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} fullWidth multiline rows={3} size="small" />}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setConfirmOpen(false)} variant="outlined">Cancel</Button>
            <Button onClick={handleConfirm} variant="contained" color={actionType === "valider" ? "success" : "error"}>{submitting ? <CircularProgress size={20} /> : "Confirm"}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Sidebar>
  );
};

export default ValidationEMEA;
