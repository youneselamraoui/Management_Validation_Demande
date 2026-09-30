import {
  Box, Typography, Card, CardContent, Button, Chip, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider,
  Table, TableBody, TableCell, TableHead, TableRow
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import DetailsDemande from "../components/DetailsDemande";

const InsertionSAP = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsDemande, setDetailsDemande] = useState(null);
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

  const getTotal = (details) => {
    return details?.reduce((sum, d) => {
      const prix = parseFloat(d.prix);
      return sum + (isNaN(prix) ? 0 : prix * d.quantite);
    }, 0) ?? 0;
  };

  const getDevise = (details) => details?.[0]?.devis ?? "—";

  const getSupplierName = (d) => {
    if (!d) return "—";
    const nom = d.fournisseur?.nom ?? d.Fournisseur?.Nom ?? d.fournisseur?.Nom ?? d.Fournisseur?.nom;
    if (nom) return nom;
    const fid = d.fournisseurId ?? d.FournisseurId;
    if (fid != null && fid !== "") return `Fournisseur #${fid}`;
    return "—";
  };

  const formatDate = (val) =>
    val
      ? new Date(val).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "—";

  if (loading) return (<Sidebar><Box sx={{ p: 3, display: "flex", justifyContent: "center" }}><CircularProgress /></Box></Sidebar>);

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>SAP Insertion - RFX</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>{demandes.length} request(s) pending SAP insertion (Director approved)</Typography>

        {demandes.length === 0 ? <Alert severity="info">No requests pending SAP insertion.</Alert> :
          demandes.map((d) => {
            const total = getTotal(d.details);
            const devise = getDevise(d.details);
            return (
              <Card key={d.id} sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Request #{d.id}
                        {d.provisionalPo && (
                          <Chip label={`Provisional PO: ${d.provisionalPo}`} color="primary" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <PersonIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                        {d.utilisateur?.nom} • {d.utilisateur?.departement || "—"}
                        {d.utilisateur?.role ? ` • ${d.utilisateur.role}` : ""}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <CalendarMonthIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                        {formatDate(d.createdAt)}
                        {d.utilisateur?.chefNom ? ` • Manager: ${d.utilisateur.chefNom}` : ""}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                        <Chip label={d.statut} color="warning" size="small" />
                        {d.capex && <Chip icon={<AccountBalanceWalletIcon />} label={`Capex: ${d.capex.nomCapex || d.capex.NomCapex || ""}`} size="small" variant="outlined" color="primary" />}
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">Quote total</Typography>
                      <Typography variant="h6" fontWeight={700} color="warning.main">
                        {total.toFixed(2)} {devise}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setDetailsDemande(d)}>View Details</Button>
                        <Button variant="contained" size="small" startIcon={<UploadFileIcon />} onClick={() => handleOpen(d)}>Insert SAP + RFX</Button>
                      </Box>
                    </Box>
                  </Box>

                  {/* ── Justification ── */}
                  {d.justification && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: "#e3f2fd", borderRadius: 2, border: "1px solid #90caf9" }}>
                      <Typography variant="caption" fontWeight={700} color="primary">Requester justification:</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{d.justification}</Typography>
                    </Box>
                  )}

                  {/* ── Commentaire existant ── */}
                  {d.commentaire && (
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e0e0e0" }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">Comment:</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{d.commentaire}</Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* ── Items table ── */}
                  <Typography variant="body2" fontWeight={600} mb={1}>Items ({d.details?.length || 0}):</Typography>
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
                      {d.details?.map((x, i) => (
                        <TableRow key={i}>
                          <TableCell>{x.article}</TableCell>
                          <TableCell align="right">{x.quantite}</TableCell>
                          <TableCell align="right">{getSupplierName(x)}</TableCell>
                          <TableCell align="right">{x.prix ?? "—"}</TableCell>
                          <TableCell align="right">{x.devis ?? "—"}</TableCell>
                          <TableCell align="right">{x.prix ? (x.prix * x.quantite).toFixed(2) : "—"}</TableCell>
                        </TableRow>
                      ))}
                      {total > 0 && (
                        <TableRow sx={{ bgcolor: "#f0f7ff" }}>
                          <TableCell colSpan={5} align="right"><strong>Grand Total</strong></TableCell>
                          <TableCell align="right"><strong>{total.toFixed(2)} {devise}</strong></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* ── Devis PDFs ── */}
                  {(d.cheminDevis || d.cheminDevis2 || d.cheminDevis3) && (
                    <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {d.cheminDevis && (
                        <Button variant="outlined" color="error" size="small" onClick={() => window.open(`http://localhost:5056${d.cheminDevis}`, "_blank")}>📄 Quote 1 PDF</Button>
                      )}
                      {d.cheminDevis2 && (
                        <Button variant="outlined" color="error" size="small" onClick={() => window.open(`http://localhost:5056${d.cheminDevis2}`, "_blank")}>📄 Quote 2 PDF</Button>
                      )}
                      {d.cheminDevis3 && (
                        <Button variant="outlined" color="error" size="small" onClick={() => window.open(`http://localhost:5056${d.cheminDevis3}`, "_blank")}>📄 Quote 3 PDF</Button>
                      )}
                    </Box>
                  )}

                  {/* ── Attached request file ── */}
                  {d.fichierPath && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Attached file: </Typography>
                      <Button variant="text" size="small" onClick={() => window.open(`http://localhost:5056/api/files${d.fichierPath}`, "_blank")}>Download</Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })
        }

        {/* ── Full details modal ── */}
        <DetailsDemande
          open={Boolean(detailsDemande)}
          onClose={() => setDetailsDemande(null)}
          demande={detailsDemande}
        />

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
