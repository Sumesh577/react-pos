import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { showNotification } from './notificationSlice';

// Magento GraphQL endpoint
const MAGENTO_GRAPHQL_URL = process.env.REACT_APP_MAGENTO_URL || 'http://localhost';

// GraphQL Mutations and Queries
const CREATE_CART = gql`
  mutation {
    createEmptyCart
  }
`;

const GET_CART = gql`
  query GetCart($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      items {
        id
        product {
          name
          sku
          image {
            url
          }
        }
        quantity
        prices {
          price {
            value
            currency
          }
          row_total {
            value
            currency
          }
        }
      }
      prices {
        grand_total {
          value
          currency
        }
      }
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($cartId: String!, $sku: String!, $quantity: Float!) {
    addProductsToCart(
      cartId: $cartId
      cartItems: [{ sku: $sku, quantity: $quantity }]
    ) {
      cart {
        id
        items {
          id
          product {
            name
            sku
            image {
              url
            }
          }
          quantity
          prices {
            price {
              value
              currency
            }
            row_total {
              value
              currency
            }
          }
        }
        prices {
          grand_total {
            value
            currency
          }
        }
      }
    }
  }
`;

const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($cartId: String!, $itemId: Int!) {
    removeItemFromCart(input: { cart_id: $cartId, cart_item_id: $itemId }) {
      cart {
        id
        items {
          id
          product {
            name
            sku
            image {
              url
            }
          }
          quantity
          prices {
            price {
              value
              currency
            }
            row_total {
              value
              currency
            }
          }
        }
        prices {
          grand_total {
            value
            currency
          }
        }
      }
    }
  }
`;

const PLACE_ORDER = gql`
  mutation PlaceOrder($cartId: String!) {
    placeOrder(input: { cart_id: $cartId }) {
      order {
        order_number
      }
    }
  }
`;

// Create Apollo Client for cart operations
const createCartClient = (token) => {
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
const getCartClientOrThrow = (getState) => {
  const { token } = getState().auth;
  if (!token) {
    throw new Error('No authentication token available');
  }
  return createCartClient(token);
};

// Async thunks
export const createCart = createAsyncThunk(
  'cart/createCart',
  async (_, { rejectWithValue, getState }) => {
    try {
      const client = getCartClientOrThrow(getState);
      const result = await client.mutate({
        mutation: CREATE_CART
      });
      return result.data.createEmptyCart;
    } catch (error) {
      console.error('Error creating cart:', error);
      return rejectWithValue(error.message || 'Failed to create cart');
    }
  }
);

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (cartId, { rejectWithValue, getState }) => {
    try {
      const client = getCartClientOrThrow(getState);
      const result = await client.query({
        query: GET_CART,
        variables: { cartId },
        fetchPolicy: 'no-cache'
      });
      return result.data.cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return rejectWithValue(error.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ cartId, sku, quantity }, { rejectWithValue, getState, dispatch }) => {
    try {
      const client = getCartClientOrThrow(getState);
      const result = await client.mutate({
        mutation: ADD_TO_CART,
        variables: { cartId, sku, quantity }
      });
      return result.data.addProductsToCart.cart;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ cartId, itemId, sku }, { rejectWithValue, getState }) => {
    try {
      const client = getCartClientOrThrow(getState);
      // Try the remove mutation first
      try {
        const result = await client.mutate({
          mutation: REMOVE_FROM_CART,
          variables: { cartId, itemId }
        });
        return result.data.removeItemFromCart.cart;
      } catch (removeError) {
        console.warn('Remove mutation failed, trying quantity 0 approach:', removeError);
        // Fallback: try to set quantity to 0 if we have the SKU
        if (sku) {
          const result = await client.mutate({
            mutation: ADD_TO_CART,
            variables: { cartId, sku, quantity: 0 }
          });
          return result.data.addProductsToCart.cart;
        } else {
          // If no SKU, just fetch the current cart state
          const cartResult = await client.query({
            query: GET_CART,
            variables: { cartId },
            fetchPolicy: 'no-cache'
          });
          return cartResult.data.cart;
        }
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      return rejectWithValue(error.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCartItems = createAsyncThunk(
  'cart/clearCartItems',
  async (cartId, { rejectWithValue, getState, dispatch }) => {
    try {
      const client = getCartClientOrThrow(getState);
      // Get current cart items
      const cartResult = await client.query({
        query: GET_CART,
        variables: { cartId },
        fetchPolicy: 'no-cache'
      });
      const cartItems = cartResult.data.cart.items || [];
      // Remove all items sequentially to avoid race conditions
      for (const item of cartItems) {
        try {
          // Try remove mutation first
          await client.mutate({
            mutation: REMOVE_FROM_CART,
            variables: { cartId, itemId: parseInt(item.id) }
          });
        } catch (removeError) {
          console.warn(`Remove mutation failed for item ${item.id}, trying quantity 0:`, removeError);
          try {
            // Fallback: set quantity to 0
            await client.mutate({
              mutation: ADD_TO_CART,
              variables: { cartId, sku: item.product.sku, quantity: 0 }
            });
          } catch (quantityError) {
            console.error(`Error setting quantity to 0 for item ${item.id}:`, quantityError);
            // Continue with other items even if one fails
          }
        }
      }
      // Return empty cart state
      return {
        id: cartId,
        items: [],
        prices: { grand_total: { value: 0, currency: 'USD' } }
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return rejectWithValue(error.message || 'Failed to clear cart');
    }
  }
);

export const placeOrder = createAsyncThunk(
  'cart/placeOrder',
  async (cartId, { rejectWithValue, getState }) => {
    try {
      const client = getCartClientOrThrow(getState);
      const result = await client.mutate({
        mutation: PLACE_ORDER,
        variables: { cartId }
      });
      return result.data.placeOrder.order;
    } catch (error) {
      console.error('Error placing order:', error);
      return rejectWithValue(error.message || 'Failed to place order');
    }
  }
);

const initialState = {
  cartId: null,
  items: [],
  total: 0,
  isLoading: false,
  error: null,
  orderNumber: null,
  isPlacingOrder: false
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.orderNumber = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setOrderNumber: (state, action) => {
      state.orderNumber = action.payload;
    },
    clearOrderNumber: (state) => {
      state.orderNumber = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Cart
      .addCase(createCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartId = action.payload;
        state.items = [];
        state.total = 0;
      })
      .addCase(createCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.cartId = action.payload.id;
          state.items = action.payload.items || [];
          state.total = action.payload.prices?.grand_total?.value || 0;
        }
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.cartId = action.payload.id;
          state.items = action.payload.items || [];
          state.total = action.payload.prices?.grand_total?.value || 0;
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.cartId = action.payload.id;
          state.items = action.payload.items || [];
          state.total = action.payload.prices?.grand_total?.value || 0;
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Clear Cart Items
      .addCase(clearCartItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCartItems.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.cartId = action.payload.id;
          state.items = action.payload.items || [];
          state.total = action.payload.prices?.grand_total?.value || 0;
        }
      })
      .addCase(clearCartItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.isPlacingOrder = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isPlacingOrder = false;
        state.orderNumber = action.payload.order_number;
        // Clear cart after successful order
        state.items = [];
        state.total = 0;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isPlacingOrder = false;
        state.error = action.payload;
      });
  }
});

export const { clearCart, clearError, setOrderNumber, clearOrderNumber } = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartId = (state) => state.cart.cartId;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;
export const selectOrderNumber = (state) => state.cart.orderNumber;
export const selectIsPlacingOrder = (state) => state.cart.isPlacingOrder;

export default cartSlice.reducer;
