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

// ─── Theme ──────────────────────────────────────────────────────────────────
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

// ─── Navigation ────────────────────────────────────────────────────────────
const NAVIGATION_ADMIN = [
  { kind: 'header', title: 'Main Menu' },
  {
    segment: 'creer-demande',
    title: "Purchase Request",
    icon: <DashboardIcon />,
  },
  { segment: 'historique', title: 'Request Tracking', icon: <HistoryIcon /> },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <SettingsApplicationsIcon />,
    children: [
      { segment: 'departements', title: 'Departments', icon: <BusinessCenterIcon /> },
      { segment: 'utilisateurs', title: 'Users', icon: <GroupsIcon /> },
      { segment: 'fournisseurs', title: 'Suppliers', icon: <StoreIcon /> },
      { segment: 'capex', title: 'Capex Management', icon: <AccountBalanceWalletIcon /> },
      { segment: 'taux-change', title: 'Exchange Rate', icon: <CurrencyExchangeIcon /> }
    ],
  },
  {
  segment: 'change-password',
  title: 'Change Password',
  icon: <LockResetIcon color="secondary" />,
  },
  {
    segment: 'logout',
    title: 'Logout',
    icon: <LogoutIcon color="error" />,
  },
];

const NAV_CHEF = [
  { kind: 'header', title: 'Main Menu' },
  {
    segment: 'creer-demande',
    title: "Purchase Request",
    icon: <DashboardIcon />,
  },
  {
    segment: 'validation-chef',
    title: 'Manager Approval',
    icon: <CheckCircleIcon />,
  },
  { segment: 'historique', title: 'Request Tracking', icon: <HistoryIcon /> },
  {
  segment: 'change-password',
  title: 'Change Password',
  icon: <LockResetIcon color="secondary" />,
  },
   {
  segment: 'Statistic',
  title: 'Statistics',
  icon: <LockResetIcon color="secondary" />,
  },
  {
    segment: 'logout',
    title: 'Logout',
    icon: <LogoutIcon color="error" />,
  },
];

const NAV_EMPLOYE = [
  { kind: 'header', title: 'Main Menu' },
  {
    segment: 'creer-demande',
    title: "Purchase Request",
    icon: <DashboardIcon />,
  },
  { segment: 'historique', title: 'Request Tracking', icon: <HistoryIcon /> },
   {
  segment: 'change-password',
  title: 'Change Password',
  icon: <LockResetIcon color="secondary" />,
  },
  {
    segment: 'logout',
    title: 'Logout',
    icon: <LogoutIcon color="error" />,
  },
];
const NAV_ACHAT1 = [
  { kind: 'header', title: 'Main Menu' },
  { segment: 'creer-demande', title: "Purchase Request", icon: <DashboardIcon /> },
  { segment: 'validation-achat1', title: 'Purchasing Approval 1', icon: <SearchIcon /> },
  { segment: 'insertion-sap', title: 'SAP Insertion - RFX', icon: <ReceiptLongIcon /> },
  { segment: 'suivi-po', title: 'PO Tracking', icon: <ReceiptLongIcon /> },
  { segment: 'historique', title: 'Request Tracking', icon: <HistoryIcon /> },
   {
    segment: 'settings',
    title: 'Settings',
    icon: <SettingsApplicationsIcon />,
    children: [
      { segment: 'fournisseurs', title: 'Suppliers', icon: <StoreIcon /> },
       { segment: 'capex', title: 'Capex Management', icon: <AccountBalanceWalletIcon /> },
      { segment: 'taux-change', title: 'Exchange Rate', icon: <CurrencyExchangeIcon /> }
    ],
  },
   {
  segment: 'change-password',
  title: 'Change Password',
  icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Logout', icon: <LogoutIcon color="error" /> },
];
const NAV_ACHAT2 = [
  { segment: 'creer-demande', title: "Purchase Request", icon: <DashboardIcon /> },
  { segment: 'validation-achat2', title: 'Purchasing Approval 2', icon: <FactCheckIcon /> },
   {
    segment: 'validation-chef',
    title: 'Manager Approval',
    icon: <CheckCircleIcon />,
  },
  { segment: 'suivi-po', title: 'PO Tracking', icon: <ReceiptLongIcon /> },
  { segment: 'historique', title: 'Request Tracking', icon: <HistoryIcon /> },
   {
  segment: 'change-password',
  title: 'Change Password',
  icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Logout', icon: <LogoutIcon color="error" /> },
];
const NAV_FINANCE = [
  { kind: 'header', title: 'Main Menu' },
   { segment: 'creer-demande', title: "Purchase Request", icon: <DashboardIcon /> },
  { segment: 'validation-finance', title: 'Finance Approval', icon: <AccountBalanceWalletIcon /> },
   {
    segment: 'validation-chef',
    title: 'Manager Approval',
    icon: <CheckCircleIcon />,
  },
  { segment: 'historique', title: 'Request Tracking', icon: <HistoryIcon /> },
   {
  segment: 'change-password',
  title: 'Change Password',
  icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Logout', icon: <LogoutIcon color="error" /> },
];

const NAV_DIRECTEUR = [
  { kind: 'header', title: 'Main Menu' },
  // { segment: 'creer-demande', title: "Purchase Request", icon: <DashboardIcon /> },
   {
    segment: 'validation-chef',
    title: 'Manager Approval',
    icon: <CheckCircleIcon />,
  },
  { segment: 'validation-directeur', title: 'Director Approval', icon: <FactCheckIcon /> },
  { segment: 'historique', title: 'Request Tracking', icon: <HistoryIcon /> },
   {
  segment: 'change-password',
  title: 'Change Password',
  icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Logout', icon: <LogoutIcon color="error" /> },
];

const NAV_EMEA = [
  { kind: 'header', title: 'Main Menu' },
  { segment: 'creer-demande', title: "Purchase Request", icon: <DashboardIcon /> },
  {
    segment: 'validation-chef',
    title: 'Manager Approval',
    icon: <CheckCircleIcon />,
  },
  { segment: 'validation-emea', title: 'EMEA Approval', icon: <FactCheckIcon /> },
  { segment: 'historique', title: 'Request Tracking', icon: <HistoryIcon /> },
  {
    segment: 'change-password',
    title: 'Change Password',
    icon: <LockResetIcon color="secondary" />,
  },
  { segment: 'logout', title: 'Logout', icon: <LogoutIcon color="error" /> },
];

// ─── Pure function to choose navigation ───────────────────────────────
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
    case 'emea': return NAV_EMEA;
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

  // FIX : if user is not yet in context, read localStorage
  const resolvedUser = React.useMemo(() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [user]);

  //  Navigation recalculates whenever resolvedUser?.role changes
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
      // item.href is provided by Toolpad (full path reconstructed from segments)
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
