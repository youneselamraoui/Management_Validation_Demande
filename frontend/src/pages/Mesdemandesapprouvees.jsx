import {
  Box, Typography, Card, CardContent, Chip,
  Button, Divider, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

export default function MesDemandesApprouvees() {
  const [demandes, setDemandes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [rfxValue, setRfxValue] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const token = localStorage.getItem("token");

  // Load approved requests
  const fetchMesDemandes = async () => {
    try {
      const res = await axios.get("http://localhost:5056/api/demandes/mes-bons", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("API Response:", res.data);
      setDemandes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading requests", err);
    }
  };

  useEffect(() => {
    fetchMesDemandes();
  }, []);

  const handleOpenDialog = (demande) => {
    setSelectedDemande(demande);
    setRfxValue(demande.rfx || "");
    setOpenDialog(true);
  };

  const handleSaveRfx = async () => {
    try {
      await axios.put(
        `http://localhost:5056/api/demandes/${selectedDemande.id}/rfx`,
        { rfx: rfxValue },
       { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      setDemandes(prev =>
        prev.map(d =>
          d.id === selectedDemande.id ? { ...d, rfx: rfxValue } : d
        )
      );

      setSnackbar({
        open: true,
        message: "RFX saved successfully ✅",
        severity: "success"
      });
      fetchMesDemandes(); // Reload requests to reflect changes
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Error saving RFX ❌",
        severity: "error"
      });
    } finally {
      setOpenDialog(false);
      setSelectedDemande(null);
      setRfxValue("");
    }
  };

  return (
    <Sidebar>
    <Box>
      <Typography variant="h5" gutterBottom>
        📋 My Approved Requests
      </Typography>
      <Divider />

      {Array.isArray(demandes) && demandes.length > 0 ? (
        demandes.map(d => (
          <Card key={d.id} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6">{d.titre}</Typography>
              <Chip icon={<PersonIcon />} label={`User: ${d.utilisateur?.nom}`} sx={{ mr: 1 }} />
              <Chip
                  icon={<CalendarMonthIcon />}
                  label={`Created: ${d.createdAt
                    ? new Date(d.createdAt).toLocaleString("en-GB", { timeZone: "Africa/Casablanca" })
                    : "—"}`}
                  sx={{ mr: 1 }}
                />
              <Chip icon={<CheckCircleIcon />} color="success" label={d.statut} />

              <Box mt={2}>
                <Button variant="contained" onClick={() => handleOpenDialog(d)}>
                  Enter RFX
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          No approved requests found.
        </Alert>
      )}

     <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          📝 Enter RFX
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Request #{selectedDemande?.id} —{" "}
            <strong>{selectedDemande?.utilisateur?.nom || "—"}</strong>
          </Typography>
          <TextField
            fullWidth
            label="RFX Number"
            value={rfxValue}
            onChange={(e) => setRfxValue(e.target.value)}
            placeholder="E.g.: RFX-2024-001"
            size="small"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRfx}
            disabled={!rfxValue.trim()}
          >
            Save
          </Button>
        </DialogActions>
    </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
    </Sidebar>
  );
}
