import * as React from 'react';
import PropTypes from 'prop-types';
import { createTheme } from '@mui/material';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import GroupsIcon from '@mui/icons-material/Groups';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import StoreIcon from '@mui/icons-material/Store';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import HistoryIcon from '@mui/icons-material/History';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LockResetIcon from '@mui/icons-material/LockReset';

// ─── Thème ──────────────────────────────────────────────────────────────────
const appTheme = createTheme({
  palette: {
    primary:    { main: '#3f51b5', light: '#757de8', dark: '#002984' },
    secondary:  { main: '#f50057' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text:       { primary: '#1e293b', secondary: '#64748b' },
    success:    { main: '#4caf50' },
    warning:    { main: '#ff9800' },
    error:      { main: '#f44336' },
    info:       { main: '#2196f3' },
  },
  typography: {
    fontFamily: [
      '"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
      'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 600, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1.1rem' },
    subtitle1: { fontWeight: 500 },
    body1: { lineHeight: 1.6 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px 0 rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 500, padding: '8px 16px' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiPaper:    { styleOverrides: { root: { borderRadius: 12 } } },
    MuiTable: {
      styleOverrides: {
        root: { '& .MuiTableCell-root': { borderBottom: '1px solid rgba(0,0,0,0.05)' } },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)':  { backgroundColor: '#ffffff' },
          '&:nth-of-type(even)': { backgroundColor: '#f8fafc' },
          '&:hover':             { backgroundColor: '#f1f5ff' },
        },
      },
    },
    MuiChip:      { styleOverrides: { root: { borderRadius: 6 } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } } } },
    MuiSelect:    { styleOverrides: { root: { borderRadius: 8 } } },
  },
});

// ─── Navigations ────────────────────────────────────────────────────────────
const NAVIGATION_ADMIN = [
  { kind: 'header', title: 'Main Menu' },
  {
    segment: 'creer-demande',
    title: "Demande d'achat",
    icon: <DashboardIcon />,
  },
  {
    segment: 'mes-demandes-approuvees',
    title: 'Bons de commande',
    icon: <AssignmentTurnedInIcon color="success" />,
  },
  { segment: 'historique', title: 'Historique', icon: <HistoryIcon /> },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <SettingsApplicationsIcon />,
    children: [
      { segment: 'departements', title: 'Departements', icon: <BusinessCenterIcon /> },
      { segment: 'utilisateurs', title: 'Utilisateurs', icon: <GroupsIcon /> },
      { segment: 'fournisseurs', title: 'Fournisseurs', icon: <StoreIcon /> },
      { segment: 'capex', title: 'Gestion Capex', icon: <AccountBalanceWalletIcon /> },
      { segment: 'taux-change', title: 'Taux de Change', icon: <CurrencyExchangeIcon /> }
    ],
  },
  {
  segment: 'change-password',
  title: 'Changer le mot de passe',
  icon: <LockResetIcon color="secondary" />,
  },
  {
    segment: 'logout',
    title: 'Déconnexion',
    icon: <LogoutIcon color="error" />,
  },
];

const NAV_CHEF = [
  { kind: 'header', title: 'Main Menu' },
  {
    segment: 'creer-demande',
    title: "Demande d'achat",
    icon: <DashboardIcon />,
  },
  {
    segment: 'mes-demandes-approuvees',
    title: 'Bons de commande',
    icon: <AssignmentTurnedInIcon color="success" />,
  },
  {
    segment: 'validation-chef',
    title: 'Validation Chef',
    icon: <CheckCircleIcon />,
  },
  { segment: 'historique', title: 'Historique', icon: <HistoryIcon /> },
  {
  segment: 'change-password',
  title: 'Changer le mot de passe',
  icon: <LockResetIcon color="secondary" />,
  },
   {
  segment: 'Statistic',
  title: 'Statistic',
  icon: <LockResetIcon color="secondary" />,
  },
  {
    segment: 'logout',
    title: 'Déconnexion',
    icon: <LogoutIcon color="error" />,
  },
];

const NAV_EMPLOYE = [
  { kind: 'header', title: 'Main Menu' },
  {
    segment: 'creer-demande',
    title: "Demande d'achat",
    icon: <DashboardIcon />,
  },
  {
    segment: 'mes-demandes-approuvees',
    title: 'Bons de commande',
    icon: <AssignmentTurnedInIcon color="success" />,
  },
  { segment: 'historique', title: 'Historique', icon: <HistoryIcon /> },
   {
  segment: 'change-password',
  title: 'Changer le mot de passe',
  icon: <LockResetIcon color="secondary" />,
  },
  {
    segment: 'logout',
    title: 'Déconnexion',
    icon: <LogoutIcon color="error" />,
  },
];
const NAV_ACHAT1 = [
  { kind: 'header', title: 'Main Menu' },
  { segment: 'creer-demande', title: "Demande d'achat", icon: <DashboardIcon /> },
  {
    segment: 'mes-demandes-approuvees',
    title: 'Bons de commande',
    icon: <AssignmentTurnedInIcon color="success" />,
  },
  { segment: 'validation-achat1', title: 'Validation Achat 1', icon: <SearchIcon /> },
  { segment: 'suivi-po', title: 'Suivi des PO', icon: <ReceiptLongIcon /> },
  { segment: 'historique', title: 'Historique', icon: <HistoryIcon /> },
   {
    segment: 'settings',
    title: 'Settings',
    icon: <SettingsApplicationsIcon />,
    children: [
      { segment: 'fournisseurs', title: 'Fournisseurs', icon: <StoreIcon /> },
       { segment: 'capex', title: 'Gestion Capex', icon: <AccountBalanceWalletIcon /> },
      { segment: 'taux-change', title: 'Taux de Change', icon: <CurrencyExchangeIcon /> }
    ],
  },
   {
  segment: 'change-password',
  title: 'Changer le mot de passe',
  icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Déconnexion', icon: <LogoutIcon color="error" /> },
];
const NAV_ACHAT2 = [
  { segment: 'creer-demande', title: "Demande d'achat", icon: <DashboardIcon /> },
  {
    segment: 'mes-demandes-approuvees',
    title: 'Bons de commande',
    icon: <AssignmentTurnedInIcon color="success" />,
  },
  { segment: 'validation-achat2', title: 'Validation Achat 2', icon: <FactCheckIcon /> },
   {
    segment: 'validation-chef',
    title: 'Validation Chef',
    icon: <CheckCircleIcon />,
  },
  { segment: 'suivi-po', title: 'Suivi des PO', icon: <ReceiptLongIcon /> },
  { segment: 'historique', title: 'Historique', icon: <HistoryIcon /> },
   {
  segment: 'change-password',
  title: 'Changer le mot de passe',
  icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Déconnexion', icon: <LogoutIcon color="error" /> },
];
const NAV_FINANCE = [
  { kind: 'header', title: 'Main Menu' },
   { segment: 'creer-demande', title: "Demande d'achat", icon: <DashboardIcon /> },
  {
    segment: 'mes-demandes-approuvees',
    title: 'Bons de commande',
    icon: <AssignmentTurnedInIcon color="success" />,
  },
  { segment: 'validation-finance', title: 'Validation Finance', icon: <AccountBalanceWalletIcon /> },
   {
    segment: 'validation-chef',
    title: 'Validation Chef',
    icon: <CheckCircleIcon />,
  },
  { segment: 'historique', title: 'Historique', icon: <HistoryIcon /> },
   {
  segment: 'change-password',
  title: 'Changer le mot de passe',
  icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Déconnexion', icon: <LogoutIcon color="error" /> },
];

const NAV_DIRECTEUR = [
  { kind: 'header', title: 'Main Menu' },
  // { segment: 'creer-demande', title: "Demande d'achat", icon: <DashboardIcon /> },
  {
    segment: 'mes-demandes-approuvees',
    title: 'Bons de commande',
    icon: <AssignmentTurnedInIcon color="success" />,
  },
   {
    segment: 'validation-chef',
    title: 'Validation Chef',
    icon: <CheckCircleIcon />,
  },
  { segment: 'validation-directeur', title: 'Validation Directeur', icon: <FactCheckIcon /> },
  { segment: 'historique', title: 'Historique', icon: <HistoryIcon /> },
   {
  segment: 'change-password',
  title: 'Changer le mot de passe',
  icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Déconnexion', icon: <LogoutIcon color="error" /> },
];

// ─── Fonction pure pour choisir la navigation ───────────────────────────────
function getNavigationByRole(role) {
  const r = (role ?? '').toLowerCase().trim();
  switch (r) {
    case 'admin':     return NAVIGATION_ADMIN;
    case 'chef':      return NAV_CHEF;
    case 'employe':   return NAV_EMPLOYE;
    case 'finance':   return NAV_FINANCE;
    case 'directeur': return NAV_DIRECTEUR;
    case 'achat1': return NAV_ACHAT1;
    case 'achat2': return NAV_ACHAT2;
    default:          return NAV_EMPLOYE;
  }
}

// ─── Router hook ────────────────────────────────────────────────────────────
function useAppRouter() {
  const location = useLocation();
  const navigate  = useNavigate();
  return React.useMemo(
    () => ({
      pathname: location.pathname,
      searchParams: new URLSearchParams(location.search),
      navigate: (path) => navigate(path),
      matches:  (path) => location.pathname.startsWith(path),
    }),
    [location, navigate]
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
const Sidebar = ({ children, window: windowProp }) => {
  const router           = useAppRouter();
  const { logout, user } = useAuth();
  const navigate         = useNavigate();

  // FIX : si user n'est pas encore dans le contexte, on lit localStorage
  const resolvedUser = React.useMemo(() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [user]);

  //  La navigation se recalcule dès que resolvedUser?.role change
  const navigation = React.useMemo(
    () => getNavigationByRole(resolvedUser?.role),
    [resolvedUser?.role]
  );

  const handleNavigation = async (event, item) => {
    event.preventDefault();
    if (item.segment === 'logout') {
      await logout();
      navigate('/');
    } else {
      // item.href est fourni par Toolpad (chemin complet reconstruit depuis les segments)
      navigate(item.href ?? `/${item.segment}`);
    }
  };

  const demoWindow = windowProp !== undefined ? windowProp() : undefined;

  return (
    <AppProvider
      navigation={navigation}
      branding={{ title: 'WORKFLOW', homeUrl: '/creer-demande' }}
      router={router}
      theme={appTheme}
      window={demoWindow}
    >
      <DashboardLayout onNav={handleNavigation}>
        {children}
      </DashboardLayout>
    </AppProvider>
  );
};

Sidebar.propTypes = {
  children: PropTypes.node.isRequired,
  window:   PropTypes.func,
};

export default Sidebar;