import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Divider,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useEffect, useState } from "react";

const CreerDemande = () => {
  const [articles, setArticles] = useState([{ article: "", quantite: 1, fournisseurId: null }]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [capexList, setCapexList] = useState([]);
  const [avecCapex, setAvecCapex] = useState("non"); // "oui" or "non"
  const [capexId, setCapexId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fichier, setFichier] = useState(null);
  const [justification, setJustification] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [resFournisseurs, resCapex] = await Promise.all([
          axios.get("http://localhost:5056/api/Fournisseurs/actifs", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5056/api/capex", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setFournisseurs(resFournisseurs.data);
        setCapexList(resCapex.data);
      } catch (err) {
        console.error("Error loading data", err);
        setSnackbarMessage("Error loading data.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    };
    fetchData();
  }, []);

  const handleChange = (index, field, value) => {
    const newArticles = [...articles];
    newArticles[index][field] = value;
    setArticles(newArticles);
  };

  const addArticle = () => {
    setArticles([...articles, { article: "", quantite: 1, fournisseurId: null }]);
  };

  const removeArticle = (index) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  // Supplier selected => justification required
  const hasFournisseurChoisi = articles.some(a => a.fournisseurId != null && a.fournisseurId !== "");
  const justificationRequired = hasFournisseurChoisi;

  const handleSubmit = async () => {
   try {
     setLoading(true);
     const filtered = articles.filter(a => a.article.trim() !== "");

     if (filtered.length === 0) {
       setSnackbarMessage("Please add at least one item.");
       setSnackbarSeverity("warning");
       setOpenSnackbar(true);
       return;
     }

     if (avecCapex === "oui" && !capexId) {
       setSnackbarMessage("Please select a Capex.");
       setSnackbarSeverity("warning");
       setOpenSnackbar(true);
       return;
     }

     // Validation: justification required if a supplier is selected
     const fournisseurChoisi = filtered.some(a => a.fournisseurId != null && a.fournisseurId !== "");
     if (fournisseurChoisi && !justification.trim()) {
       setSnackbarMessage("Justification is required when you select a supplier.");
       setSnackbarSeverity("warning");
       setOpenSnackbar(true);
       setLoading(false);
       return;
     }

    const token = localStorage.getItem("token");

    const formData = new FormData();
    if (avecCapex === "oui") formData.append("capexId", capexId);
    formData.append("justification", justification);

    // Details: send each item separately
    filtered.forEach((item, index) => {
      formData.append(`Details[${index}].Article`, item.article);
      formData.append(`Details[${index}].Quantite`, item.quantite);
      if (item.fournisseurId) {
        formData.append(`Details[${index}].FournisseurId`, item.fournisseurId);
      }
    });

    if (fichier) formData.append("fichier", fichier);
    // ────────────────────────────────

    await axios.post(
      "http://localhost:5056/api/demandes",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", 
        },
      }
    );

    setSnackbarMessage("Your request has been sent successfully!");
    setSnackbarSeverity("success");
    setOpenSnackbar(true);

    setArticles([{ article: "", quantite: 1, fournisseurId: null }]);
    setAvecCapex("non");
    setCapexId("");
    setJustification(""); 
    setFichier(null);       

  } catch (err) {
    console.error("Error sending request", err.response?.data);
    setSnackbarMessage("Error sending request.");
    setSnackbarSeverity("error");
    setOpenSnackbar(true);
  } finally {
    setLoading(false);
  }
};
  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom >
          Create Request
        </Typography>

        {/* ─── Capex Choice ─── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <FormControl>
            <FormLabel>Link to Capex?</FormLabel>
            <RadioGroup
              row
              value={avecCapex}
              onChange={(e) => {
                setAvecCapex(e.target.value);
                setCapexId("");
              }}
            >
              <FormControlLabel value="non" control={<Radio />} label="Without Capex" />
              <FormControlLabel value="oui" control={<Radio />} label="With Capex" />
            </RadioGroup>
          </FormControl>

          {avecCapex === "oui" && (
            <TextField
              select
              label="Select Capex"
              value={capexId}
              onChange={(e) => setCapexId(e.target.value)}
              fullWidth
              required
              sx={{ mt: 2 }}
            >
              {capexList.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nomCapex} — Remaining budget: {c.budgetRestant.toLocaleString("en-GB")} {c.devis}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label={avecCapex === "oui" ? "Justification / Purpose (Capex)" : "Purpose / Request Justification"}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            fullWidth
            multiline
            rows={3}
            required={justificationRequired}
            error={justificationRequired && !justification.trim()}
            helperText={
              justificationRequired && !justification.trim()
                ? "Justification is required because you selected a supplier"
                : justificationRequired
                ? "Justification required (supplier selected)"
                : ""
            }
            sx={{ mt: 2 }}
            placeholder="E.g.: Purchase of equipment for project X..."
          />
          {justificationRequired && (
            <Alert severity="info" sx={{ mt: 1 }}>
              You selected a supplier: please justify this choice in the field above.
            </Alert>
          )}
        </Paper>

        {/* ─── Items ─── */}
        <Paper sx={{ p: 2, mb: 3 }}>
          {articles.map((item, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
              <TextField
                label="Item"
                value={item.article}
                onChange={(e) => handleChange(index, "article", e.target.value)}
                fullWidth
              />
              <TextField
                label="Quantity"
                type="number"
                value={item.quantite}
                onChange={(e) => handleChange(index, "quantite", parseInt(e.target.value))}
                sx={{ width: 120 }}
              />
              <Select
                value={item.fournisseurId || ""}
                onChange={(e) => handleChange(index, "fournisseurId", e.target.value)}
                displayEmpty
                sx={{ width: 200 }}
              >
                <MenuItem value="">-- No supplier --</MenuItem>
                {fournisseurs.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nom}
                  </MenuItem>
                ))}
              </Select>
              <IconButton color="error" onClick={() => removeArticle(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} variant="outlined" onClick={addArticle}>
            Add item
          </Button>
        </Paper>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Attachment (optional)
          </Typography>
          <Button variant="outlined" component="label">
            📎 Choose file
            <input
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFichier(e.target.files[0])}
            />
          </Button>
          {fichier && (
            <Typography variant="body2" sx={{ mt: 1, color: "green" }}>
              ✅ {fichier.name}
            </Typography>
          )}
          </Paper>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Submit Request"}
          </Button>
          <Button variant="outlined" color="secondary">
            Cancel
          </Button>
        </Box>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={4000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Sidebar>
  );
};

export default CreerDemande;
