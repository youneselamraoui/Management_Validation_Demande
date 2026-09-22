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
  if (s.includes("informations")) return "info";
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

  // ── Load lists for selects once ──────────────────
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
        console.error("Error loading lists", err);
      }
    };
    loadLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch from backend with filters + pagination ──────────────────────
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
      params.append("page", page + 1);   // API starts at 1, DataGrid at 0
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
      setSnackbar({ open: true, message: "Error loading history", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [filtreStatut, filtreCapex, filtreDept, filtreDate, filtreUtilisateur, page, pageSize]);

  useEffect(() => {
    fetchHistorique();
  }, [fetchHistorique]);

  // When a filter changes → go back to page 0
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
      field: "statut", headerName: "Status", width: 260,
      renderCell: (params) => <Chip label={params.value} color={getStatutColor(params.value)} size="small" />,
    },
    {
      field: "createdAt", headerName: "Date", width: 160,
      renderCell: (params) => params.value
        ? new Date(params.value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : "—",
    },
    { field: "utilisateur", headerName: "Employee", width: 150, renderCell: (params) => params.value?.nom || "—" },
    { field: "departement", headerName: "Department", width: 150, renderCell: (params) => params.row.utilisateur?.departement || "—" },
    {
      field: "capexId", headerName: "Capex", width: 180,
      renderCell: (params) => { const c = capexList.find(c => c.id === params.value); return c ? c.nomCapex : "Without Capex"; },
    },
    { field: "details", headerName: "Items", width: 110, renderCell: (params) => `${params.value?.length || 0} item(s)` },
    {
      field: "actions", headerName: "Actions", width: 90, sortable: false,
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => { setSelected(params.row); setDialogOpen(true); }}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  const demandesEnAttenteInfo = demandes.filter(d => d.statut === "En attente informations complémentaires");

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Request Tracking</Typography>
        {demandesEnAttenteInfo.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            ℹ️ You have <strong>{demandesEnAttenteInfo.length} request(s)</strong> awaiting additional information — open details to respond to the approver.
          </Alert>
        )}
        {/* <Typography variant="body2" color="text.secondary" mb={3}>
          {total} request(s) found
        </Typography> */}

        {/* ─── Filters ──────────────────────────────────────────────────── */}
        <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField select label="Status" value={filtreStatut} onChange={handleFiltreChange(setFiltreStatut)} size="small" sx={{ minWidth: 220 }}>
            <MenuItem value="">— All statuses —</MenuItem>
            {statuts.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>

          <TextField select label="Capex" value={filtreCapex} onChange={handleFiltreChange(setFiltreCapex)} size="small" sx={{ minWidth: 200 }}>
            <MenuItem value="">— All Capex —</MenuItem>
            <MenuItem value="null">Without Capex</MenuItem>
            {capexList.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.nomCapex}</MenuItem>)}
          </TextField>

          <TextField select label="Department" value={filtreDept} onChange={handleFiltreChange(setFiltreDept)} size="small" sx={{ minWidth: 200 }}>
            <MenuItem value="">— All Departments —</MenuItem>
            {departementsList.map(d => <MenuItem key={d.id} value={String(d.id)}>{d.nom}</MenuItem>)}
          </TextField>

          <TextField select label="Employee" value={filtreUtilisateur} onChange={handleFiltreChange(setFiltreUtilisateur)} size="small" sx={{ minWidth: 200 }}>
            <MenuItem value="">— All Employees —</MenuItem>
            {utilisateursList.map(u => <MenuItem key={u.id} value={String(u.id)}>{u.nom}</MenuItem>)}
          </TextField>

          <TextField
            label="Date" type="date" value={filtreDate}
            onChange={handleFiltreChange(setFiltreDate)}
            size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
          />

          <Button variant="outlined" size="small" onClick={handleReset}>
            Reset
          </Button>
        </Paper>

        {/* ─── Table with server pagination ──────────────────────────── */}
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
          onResponded={fetchHistorique}
        />

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Sidebar>
  );
};

export default HistoriqueDemandes;
