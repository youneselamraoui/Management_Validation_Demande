import {
  Box, Typography, Card, CardContent, Chip, Divider, Alert,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DownloadIcon from "@mui/icons-material/Download";
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import eci_logo from "../assets/eci_logo.png";

const getBase64FromUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

const generatePO = async (b, delai = 60) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginL = 14;
  const marginR = pageWidth - 14;
  const contentW = marginR - marginL;

  const headerH = 30;
  const logoW = 35;
  const refW = 40;
  const titleW = contentW - logoW - refW;

  doc.setLineWidth(0.4);
  doc.rect(marginL, 10, contentW, headerH);
  doc.line(marginL + logoW, 10, marginL + logoW, 10 + headerH);
  doc.line(marginR - refW, 10, marginR - refW, 10 + headerH);

  const logoBase64 = await getBase64FromUrl(eci_logo);
  doc.addImage(logoBase64, "PNG", marginL + 2, 12, 28, 22);

  const titleX = marginL + logoW + titleW / 2;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Electrical Components International", titleX, 22, { align: "center" });
  doc.setFontSize(14);
  doc.text("Purchasing Order", titleX, 32, { align: "center" });

  const refX = marginR - refW + 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.line(marginR - refW, 18, marginR, 18);
  doc.line(marginR - refW, 24, marginR, 24);
  doc.line(marginR - refW, 30, marginR, 30);
  doc.text("QF008-01-04", refX, 16);
  doc.text("Edition 01", refX, 22);
  doc.text("Date :", refX, 27);
  doc.text("Page : 1 /1", refX, 38);

  const addrY = 40;
  const addrH = 22;
  doc.setLineWidth(0.4);
  doc.rect(marginL, addrY, contentW, addrH);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Electrical components International Maroc SARL", pageWidth / 2, addrY + 8, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Lot 106 Tanger Automotive City", pageWidth / 2, addrY + 14, { align: "center" });
  doc.text("Commune Jouamaa Province Fahs Anjra Tanger Maroc", pageWidth / 2, addrY + 20, { align: "center" });

  const fournisseurNom     = b.fournisseur?.nom     || "—";
  const fournisseurAdresse = b.fournisseur?.adresse || "";
  const toH = fournisseurAdresse ? 18 : 12;
  const toY = addrY + addrH;

  doc.setLineWidth(0.4);
  doc.rect(marginL, toY, contentW, toH);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TO (supplier):", marginL + 4, toY + 7);
  doc.setFont("helvetica", "bold");
  doc.text(fournisseurNom, marginL + 50, toY + 7);
  doc.setFont("helvetica", "normal");
  if (fournisseurAdresse) {
    doc.text(fournisseurAdresse, marginL + 50, toY + 13);
  }

  const gridY = toY + toH;
  const rowH  = 8;
  const colMid = pageWidth / 2;

  doc.setLineWidth(0.4);
  doc.rect(marginL, gridY, contentW, rowH * 4);
  doc.line(colMid, gridY, colMid, gridY + rowH * 4);
  for (let i = 1; i < 4; i++) {
    doc.line(marginL, gridY + rowH * i, marginR, gridY + rowH * i);
  }

  const createdAt = new Date(b.demande.createdAt).toLocaleDateString("en-GB", {
    timeZone: "Africa/Casablanca"
  });

  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", marginL + 3, gridY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(createdAt, marginL + 22, gridY + 5.5);
  doc.setFont("helvetica", "bold");
  doc.text("Requested by :", colMid + 3, gridY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(b.demande.utilisateur?.nom || "—", colMid + 42, gridY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.text("PO N°:", marginL + 3, gridY + rowH + 5.5);
  doc.setFont("helvetica", "bold");
  doc.text(b.po, marginL + 22, gridY + rowH + 5.5);
  doc.setFont("helvetica", "bold");
  doc.text("Payment terms :", colMid + 3, gridY + rowH + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${delai} days from invoice receipt date`, colMid + 42, gridY + rowH + 5.5);
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Capex (if required):", marginL + 3, gridY + rowH * 2 + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(b.demande.capex?.nomCapex || "—", marginL + 55, gridY + rowH * 2 + 5.5);
  doc.setFont("helvetica", "bold");
  doc.text("Delivery date:", colMid + 3, gridY + rowH * 2 + 5.5);
  doc.setFont("helvetica", "normal");

  doc.setFont("helvetica", "bold");
  doc.text("Offer N°:", marginL + 3, gridY + rowH * 3 + 5.5);
  doc.setFont("helvetica", "normal");

  doc.line(colMid + 60, gridY + rowH * 3, colMid + 60, gridY + rowH * 4);

  doc.setFont("helvetica", "bold");
  doc.text("Requisition N° :", colMid + 3, gridY + rowH * 3 + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(String(b.demande.id|| '—'), colMid + 44, gridY + rowH * 3 + 5.5);
  doc.setFont("helvetica", "bold");
  doc.text("Page :", colMid + 63, gridY + rowH * 3 + 5.5);
  doc.setFont("helvetica", "normal");

  const tableY = gridY + rowH * 4 + 3;

  autoTable(doc, {
    startY: tableY,
    head: [["Item", "Description", "Supp Item", "Qty", "PU", "Total"]],
    body: b.demande.details?.map((item, i) => [
      i + 1,
      item.article || "—",
      "",
      item.quantite,
      item.prix != null ? `${item.prix.toFixed(2)}` : "—",
      item.prix != null ? `${(item.prix * item.quantite).toFixed(2)}` : "—",
    ]) || [],
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: "bold",
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 17, halign: "center" },
      1: { cellWidth: 77 },
      2: { cellWidth: 26 },
      3: { cellWidth: 15, halign: "right" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 23, halign: "right" },
    },
    foot: [[
      {
        content: "Total MAD",
        colSpan: 5,
        styles: { halign: "right", fontStyle: "bold", lineWidth: 0.3 }
      },
      {
        content: `${b.demande.totalPrix?.toFixed(2)}`,
        styles: { fontStyle: "bold", lineWidth: 0.3 }
      }
    ]],
    footStyles: { fillColor: [255, 255, 255], textColor: 0 }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(0, 128, 0);
  doc.text("TP : 58280575   RC : 61731   Capital : 3 679 868 MAD", marginL, finalY);
  doc.setTextColor(0, 0, 0);

  doc.save(`PO_${b.po}.pdf`);
};

export default function SuiviPO() {
  const [bons, setBons] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBon, setSelectedBon] = useState(null);
  const [delaiInput, setDelaiInput] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("http://localhost:5056/api/bonscommande", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setBons(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleOpenDownload = (b) => {
    setSelectedBon(b);
    setDelaiInput(b.delaiPaiement?.toString() || "60");
    setDialogOpen(true);
  };

  const handleConfirmDownload = async () => {
    const delai = parseInt(delaiInput) || 60;

    // Save to database
    await axios.put(
      `http://localhost:5056/api/bonscommande/${selectedBon.id}/delai`,
      delai,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Update locally
    setBons(prev => prev.map(b =>
      b.id === selectedBon.id ? { ...b, delaiPaiement: delai } : b
    ));

    await generatePO(selectedBon, delai);
    setDialogOpen(false);
  };

  return (
    <Sidebar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          📦 PO Tracking
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={3}>
          Purchase orders generated after Director approval
        </Typography>

        {bons.length === 0 ? (
          <Alert severity="info">No purchase orders found.</Alert>
        ) : (
          bons.map(b => (
            <Card key={b.id} sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
              <CardContent>

                {/* ── Header ── */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    PO: {b.po}
                    <Chip
                      label={`RFX: ${b.demande.rfx || "—"}`}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Chip label="Purchase Order" color="success" size="small" />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleOpenDownload(b)}
                    >
                      Download PO
                    </Button>
                  </Box>
                </Box>

                {/* ── Info ── */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>{b.demande.utilisateur?.nom}</strong>
                      {" — "}{b.demande.utilisateur?.departement}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CalendarMonthIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {new Date(b.dateCreation).toLocaleString("en-GB", {
                        timeZone: "Africa/Casablanca"
                      })}
                    </Typography>
                  </Box>
                  <Chip
                    label={b.demande.capex ? `CAPEX: ${b.demande.capex.nomCapex}` : "Without CAPEX"}
                    size="small"
                    color={b.demande.capex ? "secondary" : "default"}
                  />
                  <Chip
                    label={`Supplier: ${b.fournisseur?.nom || "—"}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* ── Item details ── */}
                <Accordion disableGutters elevation={0}
                  sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2" fontWeight={600}>
                      Item Details
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                          <TableCell><strong>Item</strong></TableCell>
                          <TableCell><strong>Supplier</strong></TableCell>
                          <TableCell align="right"><strong>Qty</strong></TableCell>
                          <TableCell align="right"><strong>Unit Price</strong></TableCell>
                          <TableCell align="right"><strong>Subtotal</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {b.demande.details?.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.article}</TableCell>
                            <TableCell>{item.fournisseur?.nom || "—"}</TableCell>
                            <TableCell align="right">{item.quantite}</TableCell>
                            <TableCell align="right">
                              {item.prix != null ? `${item.prix.toFixed(2)} MAD` : "—"}
                            </TableCell>
                            <TableCell align="right">
                              {item.prix != null
                                ? `${(item.prix * item.quantite).toFixed(2)} MAD`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionDetails>
                </Accordion>

                {/* ── Total ── */}
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" fontWeight={600}>Order total:</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">
                      {b.demande.totalPrix?.toFixed(2)} MAD
                    </Typography>
                  </Box>
                </Box>

              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* ── Payment Delay Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Payment Delay</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Number of days"
            type="number"
            fullWidth
            value={delaiInput}
            onChange={(e) => setDelaiInput(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmDownload}>
            Download
          </Button>
        </DialogActions>
      </Dialog>

    </Sidebar>
  );
}
