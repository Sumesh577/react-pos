import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { showNotification } from './notificationSlice';

// Magento GraphQL endpoint
const MAGENTO_GRAPHQL_URL = process.env.REACT_APP_MAGENTO_URL || 'http://localhost';

// GraphQL mutations and queries
const LOGIN_MUTATION = gql`
  mutation GenerateCustomerToken($email: String!, $password: String!) {
    generateCustomerToken(email: $email, password: $password) {
      token
    }
  }
`;

const CUSTOMER_QUERY = gql`
  query GetCustomer {
    customer {
      id
      email
      firstname
      lastname
      date_of_birth
      gender
      taxvat
      is_subscribed
      group_id
      default_billing
      default_shipping
      addresses {
        id
        customer_id
        region {
          region_code
          region_id
          region
        }
        region_id
        country_id
        street
        company
        telephone
        fax
        postcode
        city
        firstname
        lastname
        middlename
        prefix
        suffix
        vat_id
        default_shipping
        default_billing
      }
    }
  }
`;

const REVOKE_TOKEN_MUTATION = gql`
  mutation RevokeCustomerToken {
    revokeCustomerToken {
      result
    }
  }
`;

// Create Apollo Client for auth operations
const createAuthClient = (token = null) => {
  return new ApolloClient({
    uri: `${MAGENTO_GRAPHQL_URL}/graphql`,
    cache: new InMemoryCache(),
    headers: token ? {
      'Authorization': `Bearer ${token}`
    } : {}
  });
};

// Utility function to clear auth data

const clearAuthData = () => {
  localStorage.removeItem('magento_token');
  localStorage.removeItem('user_data');
};

// Utility function to check if token is expired (basic check)
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if token has expired
    return payload.exp && payload.exp < currentTime;
  } catch (error) {
    console.warn('Error checking token expiration:', error);
    return true; // Assume expired if we can't decode
  }
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      // Create Apollo client for login
      const authClient = createAuthClient();

      // Step 1: Generate customer token
      const tokenResult = await authClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          email: credentials.username,
          password: credentials.password
        }
      });

      const token = tokenResult.data.generateCustomerToken.token;

      if (!token) {
        throw new Error('Failed to generate authentication token');
      }

      // Step 2: Get customer data using the token
      const customerClient = createAuthClient(token);
      const customerResult = await customerClient.query({
        query: CUSTOMER_QUERY,
        fetchPolicy: 'no-cache'
      });

      const customerData = customerResult.data.customer;

      if (!customerData) {
        throw new Error('Failed to fetch customer data');
      }

      // Store token and user data in localStorage
      localStorage.setItem('magento_token', token);
      localStorage.setItem('user_data', JSON.stringify(customerData));

      // Show success notification
      dispatch(showNotification('success', `Welcome back, ${customerData.firstname}!`));

      return {
        token,
        user: {
          id: customerData.id,
          email: customerData.email,
          firstname: customerData.firstname,
          lastname: customerData.lastname,
          name: `${customerData.firstname} ${customerData.lastname}`,
          role: 'Cashier', // Default role for now
          avatar: '👨‍💻',
          customerData: customerData // Store full customer data for future use
        }
      };
    } catch (error) {
      console.error('Login error:', error);

      // Handle GraphQL errors
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const graphQLError = error.graphQLErrors[0];
        return rejectWithValue(graphQLError.message || 'Authentication failed');
      }

      // Handle network errors
      if (error.networkError) {
        return rejectWithValue('Network error. Please check your connection.');
      }

      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('magento_token');

      if (token) {
        // Create Apollo client with token for logout
        const authClient = createAuthClient(token);

        try {
          // Revoke token on Magento side
          await authClient.mutate({
            mutation: REVOKE_TOKEN_MUTATION
          });
        } catch (error) {
          // Token revocation might fail, but continue with local cleanup
          console.warn('Token revocation failed:', error);
        }
      }

      // Clear local storage
      clearAuthData();

      // Clear all data from store
      dispatch(clearAllData());

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

// Async thunk for checking existing session
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('magento_token');
      const userData = localStorage.getItem('user_data');

      if (!token || !userData) {
        throw new Error('No valid session found');
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        clearAuthData();
        throw new Error('Token has expired');
      }

      // Create Apollo client with existing token
      const authClient = createAuthClient(token);

      // Verify token is still valid by making a test query
      const result = await authClient.query({
        query: CUSTOMER_QUERY,
        fetchPolicy: 'no-cache'
      });

      const customerData = result.data.customer;

      if (!customerData) {
        throw new Error('Token is invalid or expired');
      }
      // Show welcome back notification
      dispatch(showNotification('success', `Welcome back, ${customerData.firstname}!`));

      return {
        token,
        user: {
          id: customerData.id,
          email: customerData.email,
          firstname: customerData.firstname,
          lastname: customerData.lastname,
          name: `${customerData.firstname} ${customerData.lastname}`,
          role: 'Cashier', // Default role for now
          avatar: '👨‍💻',
          customerData: customerData
        }
      };
    } catch (error) {
      console.error('Auth check error:', error);

      // Clear invalid session data
      clearAuthData();

      return rejectWithValue(error.message || 'Authentication check failed');
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Check auth status cases
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isInitialized = true;
        state.error = action.payload;
      });
  }
});

export const { clearError, setLoading } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;
export const selectIsInitialized = (state) => state.auth.isInitialized;

export default authSlice.reducer;
