import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import store from './store/store';
import { checkAuthStatus } from './store/authSlice';
import Login from './pages/Login';
import POSMain from './components/POSMain';
import ProtectedRoute from './components/ProtectedRoute';
import Notification from './components/Notification';
import CategoryProductView from './components/CategoryProductView';
import './App.css';

function AppContent() {
  useEffect(() => {
    store.dispatch(checkAuthStatus());
  }, []);

  return (
    <Router>
      <div className="app">
        <Notification />
        <Routes>
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute requireAuth={true}>
                <POSMain />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute requireAuth={true}>
                <CategoryProductView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={true}>
                <POSMain />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
