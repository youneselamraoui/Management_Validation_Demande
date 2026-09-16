import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  Chip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";

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
      console.error("Erreur lors du téléchargement:", error);
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
      Télécharger
    </Button>
  );
};

const getStatutColor = (statut) => {
  if (!statut) return "default";
  const s = statut.toLowerCase();
  if (s.includes("refus")) return "error";
  if (s.includes("bon de commande")) return "success";
  if (s.includes("attente")) return "warning";
  return "default";
};

const formatDate = (val) =>
  val 
    ? new Date(val).toLocaleString("fr-FR", { 
        day: "numeric", 
        month: "long", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit" 
      }) 
    : "—";
const DetailsDemande = ({ open, onClose, demande }) => {
  if (!demande) return null;
 console.log("Demande:", demande);
  const devise = demande.details?.[0]?.devis ?? "—";
  const total = demande.details?.reduce((sum, d) => {
    const prix = parseFloat(d.prix);
    return sum + (isNaN(prix) ? 0 : prix * d.quantite);
  }, 0);
  const isRefused = demande.statut?.toLowerCase().includes("refus");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>

      {/* Header */}
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={700}>
          Détails Demande #{demande.id}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>

        {/* ─── Infos générales ─── */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Utilisateur
            </Typography>
            <Typography variant="body1">{demande.utilisateur?.nom || "—"}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Date de demande
            </Typography>
            <Typography variant="body1">{formatDate(demande.createdAt)}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Département
            </Typography>
            <Typography variant="body1">{demande.utilisateur?.departement || "—"}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Chef
            </Typography>
            <Typography variant="body1">
              {demande.utilisateur?.chefNom || (demande.utilisateur?.chefId ? "—" : "Sans chef")}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Statut
            </Typography>
            <Box mt={0.5}>
              <Chip label={demande.statut || "—"} color={getStatutColor(demande.statut)} size="small" />
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Devise
            </Typography>
            <Typography variant="body1">{devise}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Justification de la demande
            </Typography>
            <Typography variant="body1">{demande.justification || "—"}</Typography>
          </Box>

          {isRefused && (
            <Box>
              <Typography variant="caption" color="error" fontWeight={700} textTransform="uppercase">
                Raison de refus
              </Typography>
              <Typography variant="body1">{demande.commentaire || "—"}</Typography>
            </Box>
          )}


{demande.fichierPath && (
<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
              Fichier
            </Typography>
            <Typography variant="body1">{demande.fichierPath}</Typography>
            {/* ✅ Bouton de téléchargement */}
            <DownloadButton fichierPath={demande.fichierPath} />
          </Box>
        </Box>
  )}
 

   


          {!isRefused && demande.commentaire && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="caption" color="primary" fontWeight={700} textTransform="uppercase">
                Commentaire
              </Typography>
              <Typography variant="body1">{demande.commentaire}</Typography>
            </Box>
          )}
        </Box>

        {/* ─── Dates de validation ─── */}
        {(demande.dateValidationAchat1 ||
          demande.dateValidationAchat2 ||
          demande.dateValidateChef ||
          demande.dateValidateFinance ||
          demande.dateValidateDirecteur) && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
              Suivi des validations
            </Typography>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 2 }}>
              {demande.dateValidationAchat1 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Validé Achat 1</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidationAchat1)}</Typography>
                  </Box>
                </Box>
              )}
              {demande.dateValidationAchat2 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Validé Achat 2</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidationAchat2)}</Typography>
                  </Box>
                </Box>
              )}
              {demande.dateValidateChef && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Validé Chef</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidateChef)}</Typography>
                  </Box>
                </Box>
              )}
              {demande.dateValidateFinance && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Validé Finance</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidateFinance)}</Typography>
                  </Box>
                </Box>
              )}
              {demande.dateValidateDirecteur && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "#f0fff4", borderRadius: 2, border: "1px solid #4caf50" }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Validé Directeur</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(demande.dateValidateDirecteur)}</Typography>
                  </Box>
                </Box>
              )}
            </Box>

           
          </>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* ─── Articles ─── */}
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Articles ({demande.details?.length || 0})
        </Typography>

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

            {/* ─── Total ─── */}
            {total > 0 && (
              <TableRow sx={{ bgcolor: "#f0f7ff" }}>
                <TableCell colSpan={5} align="right">
                  <strong>Total général</strong>
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
        <Button variant="outlined" onClick={onClose}>Fermer</Button>
      </DialogActions>

    </Dialog>
  );
};

export default DetailsDemande;
