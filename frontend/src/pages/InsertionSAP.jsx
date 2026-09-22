import {
  Box, Typography, Card, CardContent, Button, Chip, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const InsertionSAP = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rfx, setRfx] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5056/api/demandes/sap-insertion", { headers });
      setDemandes(res.data);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Loading error", severity: "error" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDemandes(); // eslint-disable-next-line
  }, []);

  const handleOpen = (demande) => {
    setSelected(demande);
    setRfx("");
    setCommentaire("");
    setFile(null);
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!file) { setSnackbar({ open: true, message: "SAP file is required", severity: "error" }); return; }
    if (!rfx.trim()) { setSnackbar({ open: true, message: "RFX is required", severity: "error" }); return; }
    if (!commentaire.trim()) { setSnackbar({ open: true, message: "Comment is required", severity: "error" }); return; }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("rfx", rfx.trim());
      formData.append("commentaire", commentaire.trim());
      await axios.post(`http://localhost:5056/api/demandes/${selected.id}/insert-sap`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" }
      });
      setSnackbar({ open: true, message: `Request #${selected.id} inserted in SAP → sent to EMEA ✅`, severity: "success" });
      setOpenDialog(false);
      setSelected(null);
      fetchDemandes();
    } catch (err) {
      const msg = err?.response?.data?.message || "SAP insertion error";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally { setSubmitting(false); }
  };

  if (loading) return (<Sidebar><Box sx={{ p: 3, display: "flex", justifyContent: "center" }}><CircularProgress /></Box></Sidebar>);

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>SAP Insertion - RFX</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>{demandes.length} request(s) pending SAP insertion (Director approved)</Typography>

        {demandes.length === 0 ? <Alert severity="info">No requests pending SAP insertion.</Alert> :
          demandes.map((d) => (
            <Card key={d.id} sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Request #{d.id}</Typography>
                    <Typography variant="body2" color="text.secondary"><PersonIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />{d.utilisateur?.nom} • {d.utilisateur?.departement}</Typography>
                    <Chip label={d.statut} color="warning" size="small" sx={{ mt: 0.5 }} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Button variant="contained" startIcon={<UploadFileIcon />} onClick={() => handleOpen(d)}>Insert SAP + RFX</Button>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">Items: {d.details?.map(x => `${x.article} (x${x.quantite})`).join(", ")}</Typography>
                {d.cheminDevis && <Box sx={{ mt: 1 }}><Chip label="Quote 1 attached" size="small" color="success" variant="outlined" /></Box>}
              </CardContent>
            </Card>
          ))
        }

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>SAP Insertion — Request #{selected?.id}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>Please attach the SAP file (named by Provisional PO <strong>{selected?.provisionalPo || "to be generated"}</strong> on EMEA side), enter the RFX and a required comment.</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.xlsx,.xls,.doc,.docx" />
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current.click()}>{file ? `File: ${file.name}` : "Choose SAP file *"}</Button>
              {file && <Alert severity="success">Selected file: {file.name}</Alert>}
              <TextField label="RFX *" value={rfx} onChange={(e) => setRfx(e.target.value)} size="small" placeholder="E.g.: RFX-2025-001" fullWidth />
              <TextField label="Comment *" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} size="small" multiline rows={3} placeholder="Required comment for EMEA" fullWidth />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)} variant="outlined">Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="success" disabled={!file || !rfx.trim() || !commentaire.trim() || submitting}>{submitting ? <CircularProgress size={20} /> : "Confirm & Send to EMEA"}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Sidebar>
  );
};

export default InsertionSAP;
