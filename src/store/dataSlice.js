import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { showNotification } from './notificationSlice';

// Magento GraphQL endpoint
const MAGENTO_GRAPHQL_URL = process.env.REACT_APP_MAGENTO_URL || 'http://localhost';

// GraphQL Queries
const PRODUCTS_QUERY = gql`
  query GetProducts($pageSize: Int = 20, $currentPage: Int = 1, $filters: ProductAttributeFilterInput) {
    products(pageSize: $pageSize, currentPage: $currentPage, filter: $filters) {
      items {
        id
        sku
        name
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
            final_price {
              value
              currency
            }
          }
        }
        image {
          url
          label
        }
        stock_status
        type_id
        url_key
        description {
          html
        }
        short_description {
          html
        }
        categories {
          id
          name
          url_path
        }
        media_gallery {
          url
          label
        }
      }
      total_count
      page_info {
        total_pages
        current_page
        page_size
      }
    }
  }
`;

const CATEGORIES_QUERY = gql`
  query GetCategories($id: String) {
    categories(filters: { parent_id: { eq: $id } }) {
      items {
        id
        name
        url_path
        url_key
        level
        children_count
        image
        description
        meta_title
        meta_description
        include_in_menu
        position
        children {
          id
          name
          url_path
          url_key
          level
          children_count
          image
          description
          include_in_menu
          position
        }
      }
    }
  }
`;

const CUSTOMERS_QUERY = gql`
  query GetCustomers($pageSize: Int = 20, $currentPage: Int = 1) {
    customers(pageSize: $pageSize, currentPage: $currentPage) {
      items {
        id
        email
        firstname
        lastname
        date_of_birth
        gender
        taxvat
        is_subscribed
        group_id
        created_at
        updated_at
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
      total_count
      page_info {
        total_pages
        current_page
        page_size
      }
    }
  }
`;

const CUSTOMER_ORDERS_QUERY = gql`
  query GetCustomerOrders($customerId: Int!, $pageSize: Int = 20, $currentPage: Int = 1) {
    customer(id: $customerId) {
      id
      email
      firstname
      lastname
      orders(pageSize: $pageSize, currentPage: $currentPage) {
        items {
          id
          order_number
          created_at
          grand_total {
            value
            currency
          }
          status
          state
          customer_email
          customer_firstname
          customer_lastname
          billing_address {
            firstname
            lastname
            street
            city
            region
            postcode
            country_code
            telephone
          }
          shipping_address {
            firstname
            lastname
            street
            city
            region
            postcode
            country_code
            telephone
          }
          items {
            id
            product_name
            product_sku
            quantity_ordered
            price {
              value
              currency
            }
            row_total {
              value
              currency
            }
          }
          payment {
            method
            amount_paid {
              value
              currency
            }
          }
          shipping_method
          total {
            subtotal {
              value
              currency
            }
            shipping {
              value
              currency
            }
            tax {
              value
              currency
            }
            grand_total {
              value
              currency
            }
          }
        }
        total_count
        page_info {
          total_pages
          current_page
          page_size
        }
      }
    }
  }
`;

const ORDERS_QUERY = gql`
  query GetOrders($pageSize: Int = 20, $currentPage: Int = 1) {
    orders(pageSize: $pageSize, currentPage: $currentPage) {
      items {
        id
        order_number
        created_at
        grand_total {
          value
          currency
        }
        status
        state
        customer_email
        customer_firstname
        customer_lastname
        billing_address {
          firstname
          lastname
          street
          city
          region
          postcode
          country_code
          telephone
        }
        shipping_address {
          firstname
          lastname
          street
          city
          region
          postcode
          country_code
          telephone
        }
        items {
          id
          product_name
          product_sku
          quantity_ordered
          price {
            value
            currency
          }
          row_total {
            value
            currency
          }
        }
        payment {
          method
          amount_paid {
            value
            currency
          }
        }
        shipping_method
        total {
          subtotal {
            value
            currency
          }
          shipping {
            value
            currency
          }
          tax {
            value
            currency
          }
          grand_total {
            value
            currency
          }
        }
      }
      total_count
      page_info {
        total_pages
        current_page
        page_size
      }
    }
  }
`;

// Create Apollo Client for data operations
    const createDataClient = (token) => {
    return new ApolloClient({
        uri: `${MAGENTO_GRAPHQL_URL}/graphql`,
        cache: new InMemoryCache(),
        headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
        }
    });
    };


  // Utility to get Apollo client with token or throw error
  const getDataClientOrThrow = (getState) => {
    const { token } = getState().auth;
    if (!token) {
      throw new Error('No authentication token available');
    }
    return createDataClient(token);
  };

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'data/fetchProducts',
  async ({ pageSize = 20, currentPage = 1, filters = {} }, { rejectWithValue, getState }) => {
    try {
      const client = getDataClientOrThrow(getState);
      const result = await client.query({
        query: PRODUCTS_QUERY,
        variables: { pageSize, currentPage, filters },
        fetchPolicy: 'no-cache'
      });

      return result.data.products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

// Async thunk for fetching categories
export const fetchCategories = createAsyncThunk(
  'data/fetchCategories',
  async ({ parentId = null } = {}, { rejectWithValue, getState }) => {
    try {
      const client = getDataClientOrThrow(getState);
      const result = await client.query({
        query: CATEGORIES_QUERY,
        variables: { id: parentId ? parentId.toString() : null },
        fetchPolicy: 'no-cache'
      });

      return result.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

// Async thunk for fetching customers
export const fetchCustomers = createAsyncThunk(
  'data/fetchCustomers',
  async ({ pageSize = 20, currentPage = 1 } = {}, { rejectWithValue, getState }) => {
    try {
      const client = getDataClientOrThrow(getState);
      const result = await client.query({
        query: CUSTOMERS_QUERY,
        variables: { pageSize, currentPage },
        fetchPolicy: 'no-cache'
      });

      return result.data.customers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return rejectWithValue(error.message || 'Failed to fetch customers');
    }
  }
);

// Async thunk for fetching orders
export const fetchOrders = createAsyncThunk(
  'data/fetchOrders',
  async ({ pageSize = 20, currentPage = 1 } = {}, { rejectWithValue, getState }) => {
    try {
      const client = getDataClientOrThrow(getState);
      const result = await client.query({
        query: ORDERS_QUERY,
        variables: { pageSize, currentPage },
        fetchPolicy: 'no-cache'
      });

      return result.data.orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

// Async thunk for fetching customer orders
export const fetchCustomerOrders = createAsyncThunk(
  'data/fetchCustomerOrders',
  async ({ customerId, pageSize = 20, currentPage = 1 }, { rejectWithValue, getState }) => {
    try {
      const client = getDataClientOrThrow(getState);
      const result = await client.query({
        query: CUSTOMER_ORDERS_QUERY,
        variables: { customerId, pageSize, currentPage },
        fetchPolicy: 'no-cache'
      });

      return {
        customer: result.data.customer,
        orders: result.data.customer.orders
      };
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return rejectWithValue(error.message || 'Failed to fetch customer orders');
    }
  }
);

// Async thunk for fetching all data after login
export const fetchAllData = createAsyncThunk(
  'data/fetchAllData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Fetch all data in parallel
      const results = await Promise.allSettled([
        dispatch(fetchProducts({ pageSize: 50, currentPage: 1 })).unwrap(),
        dispatch(fetchCategories({ parentId: "2" })).unwrap(),
        // dispatch(fetchCustomers({ pageSize: 50, currentPage: 1 })).unwrap(),
        // dispatch(fetchOrders({ pageSize: 50, currentPage: 1 })).unwrap()
      ]);

      // Check if any requests failed
      const failedRequests = results.filter(result => result.status === 'rejected');
      if (failedRequests.length > 0) {
        console.warn('Some data fetch requests failed:', failedRequests);
      }

      return {
        products: results[0].status === 'fulfilled' ? results[0].value : null,
        categories: results[1].status === 'fulfilled' ? results[1].value : null,
        // customers: results[2].status === 'fulfilled' ? results[2].value : null,
        // orders: results[3].status === 'fulfilled' ? results[3].value : null
      };
    } catch (error) {
      console.error('Error fetching all data:', error);
      return rejectWithValue(error.message || 'Failed to fetch data');
    }
  }
);

const initialState = {
  products: {
    items: [],
    total_count: 0,
    page_info: null,
    isLoading: false,
    error: null
  },
  categories: {
    items: [],
    isLoading: false,
    error: null
  },
  customers: {
    items: [],
    total_count: 0,
    page_info: null,
    isLoading: false,
    error: null
  },
  orders: {
    items: [],
    total_count: 0,
    page_info: null,
    isLoading: false,
    error: null
  },
  customerOrders: {
    customer: null,
    orders: {
      items: [],
      total_count: 0,
      page_info: null
    },
    isLoading: false,
    error: null
  },
  isInitialized: false
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearDataErrors: (state) => {
      state.products.error = null;
      state.categories.error = null;
      state.customers.error = null;
      state.orders.error = null;
      state.customerOrders.error = null;
    },
    clearAllData: (state) => {
      state.products = initialState.products;
      state.categories = initialState.categories;
      state.customers = initialState.customers;
      state.orders = initialState.orders;
      state.customerOrders = initialState.customerOrders;
      state.isInitialized = false;
    },
    clearCustomerOrders: (state) => {
      state.customerOrders = initialState.customerOrders;
    }
  },
  extraReducers: (builder) => {
    builder
      // Products
      .addCase(fetchProducts.pending, (state) => {
        state.products.isLoading = true;
        state.products.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products.isLoading = false;
        state.products.items = action.payload.items;
        state.products.total_count = action.payload.total_count;
        state.products.page_info = action.payload.page_info;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.products.isLoading = false;
        state.products.error = action.payload;
      })
      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.categories.isLoading = true;
        state.categories.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories.isLoading = false;
        state.categories.items = action.payload.items;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categories.isLoading = false;
        state.categories.error = action.payload;
      })
      // Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.customers.isLoading = true;
        state.customers.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers.isLoading = false;
        state.customers.items = action.payload.items;
        state.customers.total_count = action.payload.total_count;
        state.customers.page_info = action.payload.page_info;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.customers.isLoading = false;
        state.customers.error = action.payload;
      })
      // Orders
      .addCase(fetchOrders.pending, (state) => {
        state.orders.isLoading = true;
        state.orders.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders.isLoading = false;
        state.orders.items = action.payload.items;
        state.orders.total_count = action.payload.total_count;
        state.orders.page_info = action.payload.page_info;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.orders.isLoading = false;
        state.orders.error = action.payload;
      })
      // Customer Orders
      .addCase(fetchCustomerOrders.pending, (state) => {
        state.customerOrders.isLoading = true;
        state.customerOrders.error = null;
      })
      .addCase(fetchCustomerOrders.fulfilled, (state, action) => {
        state.customerOrders.isLoading = false;
        state.customerOrders.customer = action.payload.customer;
        state.customerOrders.orders = action.payload.orders;
      })
      .addCase(fetchCustomerOrders.rejected, (state, action) => {
        state.customerOrders.isLoading = false;
        state.customerOrders.error = action.payload;
      })
      // All Data
      .addCase(fetchAllData.pending, (state) => {
        state.products.isLoading = true;
        state.categories.isLoading = true;
        state.customers.isLoading = true;
        state.orders.isLoading = true;
      })
      .addCase(fetchAllData.fulfilled, (state, action) => {
        state.products.isLoading = false;
        state.categories.isLoading = false;
        state.customers.isLoading = false;
        state.orders.isLoading = false;

        if (action.payload.products) {
          state.products.items = action.payload.products.items;
          state.products.total_count = action.payload.products.total_count;
          state.products.page_info = action.payload.products.page_info;
        }

        if (action.payload.categories) {
          state.categories.items = action.payload.categories.items;
        }

        if (action.payload.customers) {
          state.customers.items = action.payload.customers.items;
          state.customers.total_count = action.payload.customers.total_count;
          state.customers.page_info = action.payload.customers.page_info;
        }

        if (action.payload.orders) {
          state.orders.items = action.payload.orders.items;
          state.orders.total_count = action.payload.orders.total_count;
          state.orders.page_info = action.payload.orders.page_info;
        }

        state.isInitialized = true;
      })
      .addCase(fetchAllData.rejected, (state, action) => {
        state.products.isLoading = false;
        state.categories.isLoading = false;
        state.customers.isLoading = false;
        state.orders.isLoading = false;
        state.products.error = action.payload;
        state.categories.error = action.payload;
        state.customers.error = action.payload;
        state.orders.error = action.payload;
      });
  }
});

export const { clearDataErrors, clearAllData, clearCustomerOrders } = dataSlice.actions;

// Selectors
export const selectProducts = (state) => state.data.products;
export const selectCategories = (state) => state.data.categories;
export const selectCustomers = (state) => state.data.customers;
export const selectOrders = (state) => state.data.orders;
export const selectCustomerOrders = (state) => state.data.customerOrders;
export const selectIsDataInitialized = (state) => state.data.isInitialized;

export default dataSlice.reducer;
