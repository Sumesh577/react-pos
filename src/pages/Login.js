import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';
import { loginUser, selectError, selectIsLoading, clearError } from '../store/authSlice';

const Login = () => {
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = useSelector(selectIsLoading);
  const errorMessage = useSelector(selectError);

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleLogin = async () => {
    if (!loginCredentials.username || !loginCredentials.password) {
      return;
    }

    const result = await dispatch(loginUser(loginCredentials));

    if (loginUser.fulfilled.match(result)) {
      // Redirect to the page they were trying to access, or to POS
      const from = location.state?.from?.pathname || '/pos';
      navigate(from, { replace: true });
    }
    // If loginUser.rejected.match(result), the error will be automatically
    // displayed through the error state from the Redux store
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>POS System</h1>
          <p>Point of Sale Management</p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={loginCredentials.username}
              onChange={e => {
                setLoginCredentials({...loginCredentials, username: e.target.value});
                if (errorMessage) dispatch(clearError());
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={loginCredentials.password}
              onChange={e => {
                setLoginCredentials({...loginCredentials, password: e.target.value});
                if (errorMessage) dispatch(clearError());
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>

          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={isLoading || !loginCredentials.username || !loginCredentials.password}
          >
            {isLoading ? (
              <>
                <FaSpinner className="spinner" /> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
