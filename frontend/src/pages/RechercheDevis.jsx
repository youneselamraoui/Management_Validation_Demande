import {
  Box, Typography, Card, CardContent,
  Button, TextField, Select, MenuItem,
  Divider, IconButton, Snackbar, Alert, CircularProgress,
  Paper, Chip, Table, TableBody, TableCell, TableHead, TableRow
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const RechercheDevis = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [demande, setDemande]           = useState(null);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [details, setDetails]           = useState([]);
  const [capexList, setCapexList]       = useState([]);
  const [capexId, setCapexId]           = useState(null);
  const [tauxChanges, setTauxChanges]   = useState([]);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [snackbar, setSnackbar]         = useState({ open: false, message: "", severity: "success" });
  const [devise, setDevise]             = useState("MAD");
  const [LoadingConfirmer, setLoadingConfirmer] = useState(false);
  const [Loading, setLoding] = useState(false);

  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      setLoding(true);
      try {
        const [resDemande, resFournisseurs, resCapex, resTaux] = await Promise.all([
          axios.get(`http://localhost:5056/api/demandes/${id}`, { headers }),
          axios.get("http://localhost:5056/api/Fournisseurs/actifs", { headers }),
          axios.get("http://localhost:5056/api/capex", { headers }),
          axios.get("http://localhost:5056/api/tauxchange", { headers }),
        ]);

        setDemande(resDemande.data);
        setFournisseurs(resFournisseurs.data);
        setCapexList(resCapex.data);
        setTauxChanges(resTaux.data);
        setCapexId(resDemande.data.capexId ?? null);
        setDevise(resDemande.data.details[0]?.devis ?? "MAD");

        setDetails(resDemande.data.details.map(d => ({
          id:            d.id,
          article:       d.article,
          quantite:      d.quantite,
          fournisseurId: d.fournisseurId ?? "",
          prix:          d.prix ?? "",
          showForm:      d.fournisseurId != null,
        })));
      } catch (err) {
        console.error("Erreur chargement", err);
      } finally {
        setLoding(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const convertir = useCallback((montant, source, cible) => {
    if (!montant || isNaN(montant)) return 0;
    if (source === cible) return montant;
    const direct = tauxChanges.find(t => t.devisSource === source && t.devisCible === cible);
    if (direct) return montant * direct.taux;
    return 0;
  }, [tauxChanges]);

  const handleChange = (index, field, value) => {
    const updated = [...details];
    updated[index][field] = value;
    setDetails(updated);
  };

  const toggleForm = (index) => {
    const updated = [...details];
    updated[index].showForm = !updated[index].showForm;
    setDetails(updated);
  };

  const getTotal = (detail) => {
    const prix = parseFloat(detail.prix);
    if (!prix || isNaN(prix)) return null;
    return (prix * detail.quantite);
  };

  const handleUploadDevis = async (file, slot = 1) => {
    if (!file) return;
    setUploadingSlot(slot);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `http://localhost:5056/api/demandes/${id}/upload-devis?slot=${slot}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const key = slot === 1 ? "cheminDevis" : slot === 2 ? "cheminDevis2" : "cheminDevis3";
      setDemande(prev => ({ ...prev, [key]: res.data.chemin }));
      setSnackbar({ open: true, message: `Devis ${slot} PDF uploadé avec succès ✅`, severity: "success" });
    } catch (err) {
      console.error("Erreur upload", err);
      setSnackbar({ open: true, message: `Erreur lors de l'upload du devis ${slot}`, severity: "error" });
    } finally {
      setUploadingSlot(null);
      // Reset input pour permettre re-upload du même fichier
      const ref = slot === 1 ? fileInputRef1 : slot === 2 ? fileInputRef2 : fileInputRef3;
      if (ref.current) ref.current.value = "";
    }
  };

  const selectedCapex = capexList.find(c => c.id === Number(capexId)) ?? null;
  const devisCapex    = selectedCapex?.devis ?? devise;

  const totalConverti = details.reduce((sum, d) => {
    const prix = parseFloat(d.prix);
    if (!prix || isNaN(prix)) return sum;
    return sum + convertir(prix * d.quantite, devise, devisCapex);
  }, 0);

  const budgetRestant = selectedCapex ? selectedCapex.budgetRestant - totalConverti : null;
  const budgetDepasse = budgetRestant !== null && budgetRestant < 0;

  const tauxAffiches = tauxChanges.filter(t => t.devisCible === devisCapex && t.devisSource !== devisCapex);

  const handleSubmit = async () => {
    if (budgetDepasse) {
      setSnackbar({
        open: true,
        message: `Budget Capex dépassé ! Total : ${totalConverti} ${devisCapex} > Restant : ${selectedCapex.budgetRestant.toLocaleString("fr-FR")} ${devisCapex}`,
        severity: "error"
      });
      return;
    }

    try {
      setLoadingConfirmer(true);
      await axios.put(
        `http://localhost:5056/api/demandes/${id}/details`,
        details.map(d => ({
          id:            d.id,
          fournisseurId: d.fournisseurId || null,
          prix:          parseFloat(d.prix) || null,
          devis:         devise,
        })),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );

      if (demande.capexId) {
        await axios.put(
          `http://localhost:5056/api/demandes/${id}/budget`,
          { montantReserve: totalConverti, budgetRestant: budgetRestant },
          { headers: { ...headers, "Content-Type": "application/json" } }
        );
      }

      await axios.put(
        `http://localhost:5056/api/demandes/${id}/statut`,
        { action: "valider", commentaire: "" },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );

      setSnackbar({ open: true, message: "Devis soumis au Achat2 ✅", severity: "success" });
      setTimeout(() => navigate("/validation-achat1"), 1500);
    } catch (err) {
      console.error("Erreur soumission", err);
      setSnackbar({ open: true, message: "Erreur lors de la soumission", severity: "error" });
    } finally {
      setLoadingConfirmer(false);
    }
  };

  if (Loading) return (
    <Sidebar>
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    </Sidebar>
  );

  if (!demande) return null;

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Recherche Fournisseurs — Demande #{demande.id}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={3}>
          {demande.utilisateur?.nom} • {demande.utilisateur?.departement} •{" "}
          {demande.createdAt
            ? new Date(demande.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric"
              })
            : "—"}
        </Typography>

        {/* ✅ Bloc Upload Devis PDF — 3 devis côte à côte */}
        <Paper sx={{ p: 2.5, mb: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <PictureAsPdfIcon color="error" />
            <Typography variant="h6" fontWeight={600}>Devis PDF</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, flexWrap: "wrap" }}>

            {/* ── Devis 1 ── */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 220 }}>
              <input
                ref={fileInputRef1}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadDevis(e.target.files[0], 1);
                  }
                }}
              />
              <Button
                variant="outlined"
                startIcon={uploadingSlot === 1 ? <CircularProgress size={16} /> : <UploadFileIcon />}
                disabled={uploadingSlot !== null}
                onClick={() => fileInputRef1.current.click()}
              >
                {uploadingSlot === 1 ? "Upload en cours..." : "Joindre le devis 1 PDF"}
              </Button>
              {demande.cheminDevis ? (
                <Chip
                  icon={<PictureAsPdfIcon />}
                  label="✅ Devis 1 joint — Cliquer pour voir"
                  color="success"
                  variant="outlined"
                  onClick={() => window.open(`http://localhost:5056${demande.cheminDevis}`, "_blank")}
                  sx={{ cursor: "pointer" }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">Aucun devis 1 joint.</Typography>
              )}
            </Box>

            {/* ── Devis 2 ── */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 220 }}>
              <input
                ref={fileInputRef2}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadDevis(e.target.files[0], 2);
                  }
                }}
              />
              <Button
                variant="outlined"
                color="secondary"
                startIcon={uploadingSlot === 2 ? <CircularProgress size={16} /> : <UploadFileIcon />}
                disabled={uploadingSlot !== null}
                onClick={() => fileInputRef2.current.click()}
              >
                {uploadingSlot === 2 ? "Upload en cours..." : "Joindre le devis 2 PDF"}
              </Button>
              {demande.cheminDevis2 ? (
                <Chip
                  icon={<PictureAsPdfIcon />}
                  label="✅ Devis 2 joint — Cliquer pour voir"
                  color="success"
                  variant="outlined"
                  onClick={() => window.open(`http://localhost:5056${demande.cheminDevis2}`, "_blank")}
                  sx={{ cursor: "pointer" }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">Aucun devis 2 joint.</Typography>
              )}
            </Box>

            {/* ── Devis 3 ── */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 220 }}>
              <input
                ref={fileInputRef3}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadDevis(e.target.files[0], 3);
                  }
                }}
              />
              <Button
                variant="outlined"
                color="secondary"
                startIcon={uploadingSlot === 3 ? <CircularProgress size={16} /> : <UploadFileIcon />}
                disabled={uploadingSlot !== null}
                onClick={() => fileInputRef3.current.click()}
              >
                {uploadingSlot === 3 ? "Upload en cours..." : "Joindre le devis 3 PDF"}
              </Button>
              {demande.cheminDevis3 ? (
                <Chip
                  icon={<PictureAsPdfIcon />}
                  label="✅ Devis 3 joint — Cliquer pour voir"
                  color="success"
                  variant="outlined"
                  onClick={() => window.open(`http://localhost:5056${demande.cheminDevis3}`, "_blank")}
                  sx={{ cursor: "pointer" }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">Aucun devis 3 joint.</Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {/* ─── Tableau des taux de change ─────────────────────────────────── */}
        {demande.capexId && tauxAffiches.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#fffde7", border: "1px solid #f9a825" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <CurrencyExchangeIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                Taux de change actuels (vers {devisCapex})
              </Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#fff8e1" }}>
                  <TableCell><strong>Devise</strong></TableCell>
                  <TableCell><strong>Taux vers {devisCapex}</strong></TableCell>
                  <TableCell><strong>Exemple</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tauxAffiches.map(t => (
                  <TableRow key={t.id}>
                    <TableCell><Chip label={t.devisSource} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell>1 {t.devisSource} = <strong>{t.taux.toFixed(4)}</strong> {t.devisCible}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      100 {t.devisSource} = {(100 * t.taux)} {t.devisCible}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* ─── Bloc Capex ──────────────────────────────────────────────────── */}
        {demande.capexId && (
          <Paper
            sx={{
              p: 2.5, mb: 3,
              border: budgetDepasse ? "1px solid #d32f2f" : selectedCapex ? "1px solid #1976d2" : "1px solid #e0e0e0",
              borderRadius: 2,
              bgcolor: budgetDepasse ? "#fff5f5" : selectedCapex ? "#f0f7ff" : "#fafafa"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <AccountBalanceWalletIcon color={budgetDepasse ? "error" : selectedCapex ? "primary" : "disabled"} />
              <Typography variant="h6" fontWeight={600}>Capex associé</Typography>
              {budgetDepasse && (
                <Chip icon={<WarningAmberIcon />} label="Budget dépassé !" color="error" size="small" />
              )}
            </Box>

            <TextField
              select
              label="Capex (optionnel)"
              value={capexId ?? ""}
              onChange={(e) => setCapexId(e.target.value || null)}
              fullWidth
              size="small"
              sx={{ mb: selectedCapex ? 2 : 0 }}
            >
              <MenuItem value="">— Sans Capex —</MenuItem>
              {capexList.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nomCapex} — Budget restant : {c.budgetRestant.toLocaleString("fr-FR")} {c.devis}
                </MenuItem>
              ))}
            </TextField>

            {selectedCapex && (
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Budget Total</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedCapex.budgetTotal.toLocaleString("fr-FR")} {selectedCapex.devis}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Budget Restant</Typography>
                  <Typography variant="body1" fontWeight={700} color="primary">
                    {selectedCapex.budgetRestant.toLocaleString("fr-FR")} {selectedCapex.devis}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total demande (converti en {selectedCapex.devis})
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="warning.main">
                    {totalConverti} {selectedCapex.devis}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Restant après demande</Typography>
                  <Typography variant="body1" fontWeight={700} color={budgetDepasse ? "error" : "success.main"}>
                    {budgetRestant !== null ? budgetRestant : "—"} {selectedCapex.devis}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* ─── Devise ─────────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" fontWeight={600}>Devise de la demande :</Typography>
          <Select size="small" value={devise} onChange={(e) => setDevise(e.target.value)}>
            <MenuItem value="MAD">MAD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="GBP">GBP</MenuItem>
            <MenuItem value="SAR">SAR</MenuItem>
            <MenuItem value="AED">AED</MenuItem>
          </Select>
        </Paper>

        {/* ─── Articles ───────────────────────────────────────────────────── */}
        {details.map((detail, index) => (
          <Card key={detail.id} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>{detail.article}</Typography>
                  <Typography variant="body2" color="text.secondary">Quantité : {detail.quantite}</Typography>
                </Box>
                {!detail.showForm && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => toggleForm(index)} size="small">
                    Ajouter un devis
                  </Button>
                )}
              </Box>

              {detail.showForm ? (
                <Box sx={{ display: "flex", gap: 2, mt: 2, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <Box sx={{ flex: 2, minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">Fournisseur</Typography>
                    <Select fullWidth size="small" value={detail.fournisseurId || ""} onChange={(e) => handleChange(index, "fournisseurId", e.target.value)} displayEmpty>
                      <MenuItem value="">-- Sélectionner --</MenuItem>
                      {fournisseurs.map(f => <MenuItem key={f.id} value={f.id}>{f.nom}</MenuItem>)}
                    </Select>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">Prix unitaire</Typography>
                    <TextField fullWidth size="small" type="number" value={detail.prix} onChange={(e) => handleChange(index, "prix", e.target.value)} placeholder="0.00" />
                  </Box>

                  {getTotal(detail) && (
                    <Box sx={{ minWidth: 160, textAlign: "center", pb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Total</Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {getTotal(detail)} {devise}
                      </Typography>
                      {selectedCapex && devise !== selectedCapex.devis && (
                        <Typography variant="caption" color="primary">
                          ≈ {convertir(parseFloat(getTotal(detail)), devise, selectedCapex.devis)} {selectedCapex.devis}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <IconButton color="error" onClick={() => toggleForm(index)} size="small" sx={{ mb: 0.5 }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun devis ajouté. Cliquez sur "Ajouter un devis" pour commencer.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* ─── Total général ───────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Paper sx={{ p: 2, minWidth: 280, textAlign: "right", bgcolor: "#fafafa" }}>
            <Typography variant="body2" color="text.secondary">
              {selectedCapex ? `Total converti (Budget ${devisCapex})` : "Total de la demande"}
            </Typography>
            <Typography variant="h5" fontWeight={700} color={budgetDepasse ? "error" : "warning.main"}>
              {selectedCapex
                ? `${totalConverti} ${devisCapex}`
                : `${details.reduce((sum, d) => sum + (parseFloat(d.prix) * d.quantite || 0), 0)} ${devise}`
              }
            </Typography>
            {selectedCapex && devise !== devisCapex && (
              <Typography variant="caption" color="text.secondary">
                Montant saisi : {details.reduce((sum, d) => sum + (parseFloat(d.prix) * d.quantite || 0), 0)} {devise}
              </Typography>
            )}
          </Paper>
        </Box>

        {/* ─── Actions ─────────────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={handleSubmit}
            disabled={budgetDepasse || details.some(d => !d.fournisseurId || !d.prix)}
          >
            {LoadingConfirmer ? <CircularProgress size={20} /> : "Soumettre les devis au Chef département"}
          </Button>
          <Button variant="outlined" color="inherit" size="large" onClick={() => navigate("/validation-achat1")}>
            Annuler
          </Button>
        </Box>

      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Sidebar>
  );
};

export default RechercheDevis;