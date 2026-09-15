import {
  Box, Typography, Paper, TextField, MenuItem,
  Chip, IconButton, CircularProgress, Snackbar, Alert, Button
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import DetailsDemande from "../components/DetailsDemande";

const getStatutColor = (statut) => {
  if (!statut) return "default";
  const s = statut.toLowerCase();
  if (s.includes("refus")) return "error";
  if (s.includes("bon de commande")) return "success";
  if (s.includes("attente")) return "warning";
  return "default";
};

const HistoriqueDemandes = () => {
  const [demandes, setDemandes]             = useState([]);
  const [total, setTotal]                   = useState(0);
  const [page, setPage]                     = useState(0);
  const [pageSize, setPageSize]             = useState(10);
  const [capexList, setCapexList]           = useState([]);
  const [utilisateursList, setUtilisateurs] = useState([]);
  const [departementsList, setDepartements] = useState([]);
  const [statuts, setStatuts]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedDemande, setSelected]      = useState(null);
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [snackbar, setSnackbar]             = useState({ open: false, message: "", severity: "error" });

  const [filtreStatut, setFiltreStatut]           = useState("");
  const [filtreCapex, setFiltreCapex]             = useState("");
  const [filtreDept, setFiltreDept]               = useState("");
  const [filtreDate, setFiltreDate]               = useState("");
  const [filtreUtilisateur, setFiltreUtilisateur] = useState("");

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Charger les listes pour les selects une seule fois ──────────────────
  useEffect(() => {
    const loadLists = async () => {
      try {
        const [resCapex, resUtilisateurs, resDepartements] = await Promise.all([
          axios.get("http://localhost:5056/api/capex", { headers }),
          axios.get("http://localhost:5056/api/utilisateurs", { headers }),
          axios.get("http://localhost:5056/api/departements", { headers }),
        ]);
        setCapexList(resCapex.data);
        setUtilisateurs(resUtilisateurs.data);
        setDepartements(resDepartements.data);
      } catch (err) {
        console.error("Erreur chargement listes", err);
      }
    };
    loadLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch depuis backend avec filtres + pagination ──────────────────────
  const fetchHistorique = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtreStatut)           params.append("statut", filtreStatut);
      if (filtreCapex === "null") params.append("sansCapex", "true");
      else if (filtreCapex)       params.append("capexId", filtreCapex);
      if (filtreDept)             params.append("departementId", filtreDept);
      if (filtreDate)             params.append("date", filtreDate);
      if (filtreUtilisateur)      params.append("utilisateurId", filtreUtilisateur);
      params.append("page", page + 1);   // API commence à 1, DataGrid à 0
      params.append("pageSize", pageSize);

      const res = await axios.get(
        `http://localhost:5056/api/demandes/historique?${params.toString()}`,
        { headers }
      );

      setDemandes(res.data.data);
      setTotal(res.data.total);
      setStatuts([...new Set(res.data.data.map(d => d.statut).filter(Boolean))]);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur chargement historique", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [filtreStatut, filtreCapex, filtreDept, filtreDate, filtreUtilisateur, page, pageSize]);

  useEffect(() => {
    fetchHistorique();
  }, [fetchHistorique]);

  // Quand un filtre change → revenir à la page 0
  const handleFiltreChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleReset = () => {
    setFiltreStatut("");
    setFiltreCapex("");
    setFiltreDept("");
    setFiltreDate("");
    setFiltreUtilisateur("");
    setPage(0);
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "statut", headerName: "Statut", width: 260,
      renderCell: (params) => <Chip label={params.value} color={getStatutColor(params.value)} size="small" />,
    },
    {
      field: "createdAt", headerName: "Date", width: 160,
      renderCell: (params) => params.value
        ? new Date(params.value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : "—",
    },
    { field: "utilisateur", headerName: "Employé", width: 150, renderCell: (params) => params.value?.nom || "—" },
    { field: "departement", headerName: "Département", width: 150, renderCell: (params) => params.row.utilisateur?.departement || "—" },
    {
      field: "capexId", headerName: "Capex", width: 180,
      renderCell: (params) => { const c = capexList.find(c => c.id === params.value); return c ? c.nomCapex : "Sans Capex"; },
    },
    { field: "details", headerName: "Articles", width: 110, renderCell: (params) => `${params.value?.length || 0} article(s)` },
    {
      field: "actions", headerName: "Actions", width: 90, sortable: false,
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => { setSelected(params.row); setDialogOpen(true); }}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Historique des Demandes</Typography>
        {/* <Typography variant="body2" color="text.secondary" mb={3}>
          {total} demande(s) trouvée(s)
        </Typography> */}

        {/* ─── Filtres ──────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField select label="Statut" value={filtreStatut} onChange={handleFiltreChange(setFiltreStatut)} size="small" sx={{ minWidth: 220 }}>
            <MenuItem value="">— Tous les statuts —</MenuItem>
            {statuts.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>

          <TextField select label="Capex" value={filtreCapex} onChange={handleFiltreChange(setFiltreCapex)} size="small" sx={{ minWidth: 200 }}>
            <MenuItem value="">— Tous les Capex —</MenuItem>
            <MenuItem value="null">Sans Capex</MenuItem>
            {capexList.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.nomCapex}</MenuItem>)}
          </TextField>

          <TextField select label="Département" value={filtreDept} onChange={handleFiltreChange(setFiltreDept)} size="small" sx={{ minWidth: 200 }}>
            <MenuItem value="">— Tous les Départements —</MenuItem>
            {departementsList.map(d => <MenuItem key={d.id} value={String(d.id)}>{d.nom}</MenuItem>)}
          </TextField>

          <TextField select label="Employé" value={filtreUtilisateur} onChange={handleFiltreChange(setFiltreUtilisateur)} size="small" sx={{ minWidth: 200 }}>
            <MenuItem value="">— Tous les Employés —</MenuItem>
            {utilisateursList.map(u => <MenuItem key={u.id} value={String(u.id)}>{u.nom}</MenuItem>)}
          </TextField>

          <TextField
            label="Date" type="date" value={filtreDate}
            onChange={handleFiltreChange(setFiltreDate)}
            size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
          />

          <Button variant="outlined" size="small" onClick={handleReset}>
            Réinitialiser
          </Button>
        </Paper>

        {/* ─── Tableau avec pagination serveur ──────────────────────────── */}
        <Box height="55vh">
          <DataGrid
            rows={demandes}
            columns={columns}
            rowCount={total}
            loading={loading}
            paginationMode="server"
            page={page}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            getRowId={(row) => row.id}
            components={{ Toolbar: GridToolbar }}
            disableSelectionOnClick
          />
        </Box>

        <DetailsDemande
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          demande={selectedDemande}
          capexList={capexList}
        />

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Sidebar>
  );
};

export default HistoriqueDemandes;