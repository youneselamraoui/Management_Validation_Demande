import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import { AuthProvider } from './context/AuthContext';
import CreerDemande from "./pages/CréerDemande";
import Logout from "./pages/Logout";
import Departements from "./pages/Departements/Departements";
import AddDepartement from "./pages/Departements/AddDepartement";
import EditDepartement from "./pages/Departements/EditDepartement";
import Utilisateurs from "./pages/Utilisateurs/Utilisateurs";
import AddUtilisateur from "./pages/Utilisateurs/AddUtilisateur";
import EditUtilisateur from "./pages/Utilisateurs/EditUtilisateur";
import Fournisseurs from "./pages/Fournisseurs/fournisseurs";
import AddFournisseur from "./pages/Fournisseurs/AddFournisseur";
import EditFournisseur from "./pages/Fournisseurs/EditFournisseur";
import ValidationChef from "./pages/ValidationChef";
import ValidationAchat1 from "./pages/ValidationAchat1";
import RechercheDevis from "./pages/RechercheDevis";
import GestionCapex from "./pages/Capex/GestionCapex";
import EditCapex from "./pages/Capex/EditCapex";
import AddCapex from "./pages/Capex/AddCapex";
import GestionTauxChange from "./pages/Tauxchange/Gestiontauxchange";
import AddTauxChange from "./pages/Tauxchange/Addtauxchange";
import EditTauxChange from "./pages/Tauxchange/Edittauxchange"; 
import HistoriqueDemandes from "./pages/Historiquedemandes";
import ValidationAchat2 from "./pages/Validationachat2";
import ValidationFinance from "./pages/Validationfinance";
import ValidationDirecteur from "./pages/Validationdirecteur";
import BonsCommande from "./pages/BonsCommande";
import ChangePassword from "./pages/Changepassword";
import Statistic from "./pages/Statistic";
import InsertionSAP from "./pages/InsertionSAP";
import ValidationEMEA from "./pages/ValidationEMEA";
function App() {
  return (
   <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/creer-demande" element={<CreerDemande />} />
        <Route path="/settings/departements" element={<Departements />} />
        <Route path="/settings/departements/add" element={<AddDepartement />} /> 
        <Route path="/settings/departements/edit/:id" element={<EditDepartement />} /> 
        <Route path="/settings/utilisateurs" element={<Utilisateurs />} />
        <Route path="/settings/utilisateurs/add" element={<AddUtilisateur />} />
        <Route path="/settings/utilisateurs/edit/:id" element={<EditUtilisateur />} />
        <Route path="/settings/fournisseurs" element={<Fournisseurs />} />
        <Route path="/settings/fournisseurs/add" element={<AddFournisseur/>}/>
        <Route path="/settings/fournisseurs/edit/:id" element={<EditFournisseur />} />
        <Route path="/validation-chef" element={<ValidationChef />} />
        <Route path="/validation-achat1" element={<ValidationAchat1 />} />
        <Route path="/recherche-devis/:id" element={<RechercheDevis />} />
        <Route path="/settings/capex" element={<GestionCapex />} />
        <Route path="/settings/capex/add" element={<AddCapex />} />
        <Route path="/settings/capex/edit/:id" element={<EditCapex />} />
        <Route path="/settings/taux-change" element={<GestionTauxChange />} />
        <Route path="/settings/taux-change/add" element={<AddTauxChange />} />
        <Route path="/settings/taux-change/edit/:id" element={<EditTauxChange />} />
        <Route path="/historique" element={<HistoriqueDemandes />} />
        <Route path="/validation-achat2" element={<ValidationAchat2 />} />
        <Route path="/validation-finance" element={<ValidationFinance />} />
        <Route path="/validation-directeur" element={<ValidationDirecteur />} />
        {/* page mes-demandes-approuvees cachée pour tout le monde - workflow EMEA: RFX+SAP par achat1 */}
        <Route path="/suivi-po" element={<BonsCommande />} />
        <Route path="/Statistic" element={<Statistic />} />
        <Route path="/insertion-sap" element={<InsertionSAP />} />
        <Route path="/validation-emea" element={<ValidationEMEA />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;