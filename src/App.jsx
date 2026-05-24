import WinnerList from './pages/WinnerList';
import SalesTeams from './pages/salesteam';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import User from './pages/User';
import Enquiries from './pages/Enquiries';

import EnquiriesDetails from './pages/EnquiriesDetails';
import Technicians from './pages/Technicians';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import Analytics from './pages/Analytics';
import SellCars from './pages/SellCars';
import SellCarEnquiries from './pages/SellCarEnquiries';
import SubAdmin from './pages/SubAdmin';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';
import Banners from './pages/Banners';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import AdsPopups from './pages/AdsPopups';
import Pdi from './pages/Pdi';
import Loans from './pages/Loans';
import AuctionCars from './pages/AuctionCars';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import { PermissionsProvider } from './context/PermissionsContext';
import Telecaller from './pages/Telecaller';
import Bidders from './pages/Adminbidermanagement ';
import BNB_TNB from './pages/BNB_TNB';
import RA_Assigned from './pages/RA-Assigned';
import RetailAssociate from './pages/RetailAssociate';


function App() {
  return (
    <ToastProvider>
      <PermissionsProvider>
        <Router>

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />

            {/* Protected Routes */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <Layout><User /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/telecaller"
              element={
                <ProtectedRoute>
                  <Layout><Telecaller /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/auction-winners"
              element={
                <ProtectedRoute>
                  <Layout><WinnerList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-team"
              element={
                <ProtectedRoute>
                  <Layout><SalesTeams /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bidders"
              element={
                <ProtectedRoute>
                  <Layout><Bidders /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enquiries"
              element={
                <ProtectedRoute>
                  <Layout><Enquiries /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enquiries-details"
              element={
                <ProtectedRoute>
                  <Layout><EnquiriesDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pdi"
              element={
                <ProtectedRoute>
                  <Layout><Pdi /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans"
              element={
                <ProtectedRoute>
                  <Layout><Loans /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/technicians"
              element={
                <ProtectedRoute>
                  <Layout><Technicians /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ra-assigned-enquiries"
              element={
                <ProtectedRoute>
                  <Layout><RA_Assigned /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout><Analytics /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sell-cars"
              element={
                <ProtectedRoute>
                  <Layout><SellCars /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sell-car-enquiries"
              element={
                <ProtectedRoute>
                  <Layout><SellCarEnquiries /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/auction-cars"
              element={
                <ProtectedRoute>
                  <Layout><AuctionCars /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bnb-tnb"
              element={
                <ProtectedRoute>
                  <Layout><BNB_TNB /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subadmin"
              element={
                <ProtectedRoute>
                  <Layout><SubAdmin /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/retail-associate"
              element={
                <ProtectedRoute>
                  <Layout><RetailAssociate /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute>
                  <Layout><Roles /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/permissions"
              element={
                <ProtectedRoute>
                  <Layout><Permissions /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/banners"
              element={
                <ProtectedRoute>
                  <Layout><Banners /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Layout><Notifications /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout><Settings /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ads-popups"
              element={
                <ProtectedRoute>
                  <Layout><AdsPopups /></Layout>
                </ProtectedRoute>
              }
            />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          <ToastContainer />
        </Router>
      </PermissionsProvider>
    </ToastProvider>
  );
}

export default App;
