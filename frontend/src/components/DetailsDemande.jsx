import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  Chip, Alert, TextField, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

const DownloadButton = ({ fichierPath }) => {
  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5056/api/files${fichierPath}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fichierPath.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      size="small"
      sx={{ mt: 1 }}
      onClick={handleDownload}
    >
      Download
    </Button>
  );
};

const getStatutColor = (statut) => {
  if (!statut) return "default";
  const s = statut.toLowerCase();
  if (s.includes("refus")) return "error";
  if (s.includes("bon de commande")) return "success";
  if (s.includes("informations complémentaires")) return "info";
  if (s.includes("attente")) return "warning";
  return "default";
};

const formatDate = (val) =>
  val 
    ? new Date(val).toLocaleString("en-GB", { 
        day: "numeric", 
        month: "long", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit" 
      }) 
    : "—";
const DetailsDemande = ({ open, onClose, demande, onResponded }) => {
  const { user } = useAuth();
  const [reponseText, setReponseText] = useState("");
  const [sendingReponse, setSendingReponse] = useState(false);
  const [reponseError, setReponseError] = useState("");
  const [reponseSuccess, setReponseSuccess] = useState("");

  useEffect(() => {
    setReponseText("");
    setReponseError("");
    setReponseSuccess("");
  }, [demande?.id]);

  if (!demande) return null;
  console.log("Demande:", demande);
  const devise = demande.details?.[0]?.devis ?? "—";
  const total = demande.details?.reduce((sum, d) => {
    const prix = parseFloat(d.prix);
    return sum + (isNaN(prix) ? 0 : prix * d.quantite);
  }, 0);
  const isRefused = demande.statut?.toLowerCase().includes("refus");
  const isInfoRequested = demande.statut === "En attente informations complémentaires";
  const hasInfoHistory = !!demande.infoMessage || !!demande.infoReponse;

  const resolvedUser = user ?? (() => {
    try { const s = localStorage.getItem("user"); return s ? JSON.parse(s) : null; } catch { return null; }
  })();
  const role = (resolvedUser?.role ?? "").toLowerCase().trim();
  const hideSensitiveFiles = ["chef", "directeur"].includes(role);
  const isOwner = resolvedUser?.id === demande.utilisateur?.id || resolvedUser?.id?.toString() === String(demande.utilisateur?.id);

  const handleSendReponse = async () => {
    if (!reponseText.trim()) { setReponseError("Please enter a response."); return; }
    setSendingReponse(true); setReponseError(""); setReponseSuccess("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5056/api/demandes/${demande.id}/respond-info`,
        { reponse: reponseText.trim() },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setReponseSuccess("Response sent — the request is back to approval.");
      if (onResponded) onResponded();
      // update local demande object for immediate feedback
      demande.statut = demande.statutAvantInfo || demande.statut;
      demande.infoReponse = reponseText.trim();
      setTimeout(() => { onClose(); }, 900);
    } catch (err) {
      setReponseError(err?.response?.data?.message || "Error sending response.");
    } finally { setSendingReponse(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>

      {/* Header */}
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={700}>
          Request Details #{demande.id}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>

        {/* ─── General Information ─── */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              User
            </Typography>
            <Typography variant="body1">{demande.utilisateur?.nom || "—"}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Request Date
            </Typography>
            <Typography variant="body1">{formatDate(demande.createdAt)}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Department
            </Typography>
            <Typography variant="body1">{demande.utilisateur?.departement || "—"}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Manager
            </Typography>
            <Typography variant="body1">
              {demande.utilisateur?.chefNom || (demande.utilisateur?.chefId ? "—" : "No manager")}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Status
            </Typography>
            <Box mt={0.5}>
              <Chip label={demande.statut || "—"} color={getStatutColor(demande.statut)} size="small" />
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Currency
            </Typography>
            <Typography variant="body1">{devise}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Request Justification
            </Typography>
            <Typography variant="body1">{demande.justification || "—"}</Typography>
          </Box>

          {isRefused && (
            <Box>
              <Typography variant="caption" color="error" fontWeight={700} textTransform="uppercase">
                Rejection Reason
              </Typography>
              <Typography variant="body1">{demande.commentaire || "—"}</Typography>
            </Box>
          )}


  {!hideSensitiveFiles && demande.fichierPath && (
 <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
           <Box>
             <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
               File
             </Typography>
             <Typography variant="body1">{demande.fichierPath}</Typography>
             {/* ✅ Download button */}
             <DownloadButton fichierPath={demande.fichierPath} />
           </Box>
         </Box>
   )}

          {/* ─── Quote PDF (3 files) ─── */}
          {(demande.cheminDevis || demande.cheminDevis2 || demande.cheminDevis3) && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "#fff5f5", borderRadius: 2, border: "1px solid #ffcdd2" }}>
            <Typography variant="caption" color="error" fontWeight={700} textTransform="uppercase" sx={{ mb: 1, display: "block" }}>
              Attached Quote PDFs
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {demande.cheminDevis && (
                <Button variant="outlined" color="error" size="small" onClick={() => window.open(`http://localhost:5056${demande.cheminDevis}`, "_blank")}>📄 Quote 1 PDF</Button>
              )}
              {demande.cheminDevis2 && (
                <Button variant="outlined" color="error" size="small" onClick={() => window.open(`http://localhost:5056${demande.cheminDevis2}`, "_blank")}>📄 Quote 2 PDF</Button>
              )}
              {demande.cheminDevis3 && (
                <Button variant="outlined" color="error" size="small" onClick={() => window.open(`http://localhost:5056${demande.cheminDevis3}`, "_blank")}>📄 Quote 3 PDF</Button>
              )}
            </Box>
          </Box>
        )}

          {/* ─── SAP (file + Provisional PO + comment) ─── */}
          {(demande.cheminSAP || demande.commentaireSAP || demande.rfx) && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "#e8f5e9", borderRadius: 2, border: "1px solid #a5d6a7" }}>
            <Typography variant="caption" color="success.main" fontWeight={700} textTransform="uppercase" sx={{ mb: 1, display: "block" }}>
              SAP - Provisional PO: {demande.provisionalPo || demande.rfx || "—"} | RFX: {demande.rfx || "—"}
            </Typography>
            {demande.commentaireSAP && <Typography variant="body2" sx={{ mb: 1, whiteSpace: "pre-wrap" }}><strong>Purchasing Comment:</strong> {demande.commentaireSAP}</Typography>}
            {demande.cheminSAP && (
              <Button variant="outlined" color="success" size="small" onClick={() => window.open(`http://localhost:5056${demande.cheminSAP}`, "_blank")}>📄 View SAP File — {demande.provisionalPo || "PO"}</Button>
            )}
          </Box>
        )}
 

   


          {!isRefused && demande.commentaire && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
                Comment
              </Typography>
              <Typography variant="body1">{demande.commentaire}</Typography>
            </Box>
          )}
        </Box>

        {/* ─── Additional Information Block ──────────────────────── */}
        {(isInfoRequested || hasInfoHistory) && (
          <Box sx={{ mb: 2, p: 2, bgcolor: isInfoRequested ? "#fff8e1" : "#f3e5f5", borderRadius: 2, border: isInfoRequested ? "1px solid #ffb74d" : "1px solid #ce93d8" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <HelpOutlineIcon color={isInfoRequested ? "warning" : "secondary"} fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color={isInfoRequested ? "warning.main" : "secondary.main"}>
                {isInfoRequested ? "Additional Information Required" : "Information Exchange"}
              </Typography>
              {demande.infoDemandeParRole && (
                <Chip label={`requested by ${demande.infoDemandeParRole}`} size="small" variant="outlined" sx={{ ml: 1 }} />
              )}
            </Box>
            {demande.infoMessage && (
              <Alert severity={isInfoRequested ? "warning" : "info"} sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>Approver message {demande.infoDemandeDate ? `— ${formatDate(demande.infoDemandeDate)}` : ""}:</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{demande.infoMessage}</Typography>
              </Alert>
            )}
            {demande.infoReponse && (
              <Alert severity="success" sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>Requester response {demande.infoReponseDate ? `— ${formatDate(demande.infoReponseDate)}` : ""}:</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{demande.infoReponse}</Typography>
              </Alert>
            )}
            {isInfoRequested && isOwner && !demande.infoReponse && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2" fontWeight={600} mb={1}>Your response:</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Enter the requested information..."
                  value={reponseText}
                  onChange={(e) => setReponseText(e.target.value)}
                  size="small"
                  error={!!reponseError}
                  helperText={reponseError}
                />
                {reponseSuccess && <Alert severity="success" sx={{ mt: 1 }}>{reponseSuccess}</Alert>}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={sendingReponse ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                  onClick={handleSendReponse}
                  disabled={sendingReponse || !reponseText.trim()}
                  sx={{ mt: 1 }}
                >
                  Send My Response
                </Button>
              </Box>
            )}
            {isInfoRequested && !isOwner && (
              <Typography variant="caption" color="text.secondary">Awaiting requester response ({demande.utilisateur?.nom})…</Typography>
            )}
          </Box>
        )}

        {/* ─── Validation Dates ─── */}
        {(demande.dateValidationAchat1 ||
          demande.dateValidationAchat2 ||
          demande.dateValidateChef ||
          demande.dateValidateFinance ||
          demande.dateValidateDirecteur) && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
              Approval Tracking
            </Typography>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 2 }}>
              {demande.dateValidationAchat1 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approved Purchasing 1</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidationAchat1)}</Typography>
                  </Box>
                </Box>
              )}
              {demande.dateValidationAchat2 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approved Purchasing 2</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidationAchat2)}</Typography>
                  </Box>
                </Box>
              )}
              {demande.dateValidateChef && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approved Manager</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidateChef)}</Typography>
                  </Box>
                </Box>
              )}
              {demande.dateValidateFinance && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approved Finance</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidateFinance)}</Typography>
                  </Box>
                </Box>
              )}
              {demande.dateValidateDirecteur && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approved Director</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidateDirecteur)}</Typography>
                  </Box>
                </Box>
              )}
            </Box>

           
          </>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* ─── Items ─── */}
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Items ({demande.details?.length || 0})
        </Typography>

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

            {/* ─── Total ─── */}
            {total > 0 && (
              <TableRow sx={{ bgcolor: "#f0f7ff" }}>
                <TableCell colSpan={5} align="right">
                  <strong>Grand Total</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{total.toFixed(2)} {devise}</strong>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </DialogActions>

    </Dialog>
  );
};

export default DetailsDemande;
