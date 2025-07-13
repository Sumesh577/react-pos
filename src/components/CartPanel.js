import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUserCircle, FaShoppingCart, FaPlus, FaMinus, FaTrash, FaCheck, FaPrint, FaTimes } from 'react-icons/fa';
import { removeFromCart, clearCart, placeOrder, clearOrderNumber, addToCart } from '../store/cartSlice';
import { showNotification } from '../store/notificationSlice';
import { selectCustomers } from '../store/dataSlice';
import CustomerModal from './CustomerModal';
import CustomerOrdersModal from './CustomerOrdersModal';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

const CartPanel = () => {
  const dispatch = useDispatch();
  const { items: cartItems, total: cartTotal, cartId, isLoading: isPlacingOrder, orderNumber } = useSelector(state => state.cart);
  const { items: customers, isLoading: customersLoading } = useSelector(selectCustomers);

  // Local state
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [customerOrdersModalOpen, setCustomerOrdersModalOpen] = useState(false);
  const [selectedCustomerForOrders, setSelectedCustomerForOrders] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Calculate tax and payable amount internally
  const tax = cartTotal * 0.0; // 0% tax rate
  const payable = cartTotal + tax;

  // Format customers data for the modal
  const formattedCustomers = customers.map(customer => ({
    id: customer.id,
    name: `${customer.firstname} ${customer.lastname}`,
    email: customer.email,
    phone: customer.addresses?.[0]?.telephone || 'N/A',
    orders: customer.orders?.total_count || 0,
    firstname: customer.firstname,
    lastname: customer.lastname,
    addresses: customer.addresses
  }));

  const handleRemoveItem = (item) => {
    dispatch(removeFromCart({ cartId, itemId: parseInt(item.id), sku: item.product.sku }));
    dispatch(showNotification('success', 'Item removed from cart'));
  };

  const handleQuantityChange = (item, change) => {
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      handleRemoveItem(item);
    } else {
      dispatch(addToCart({ cartId, sku: item.product.sku, quantity: newQuantity }));
    }
  };

  const handleClearCart = () => {
    if (cartId) {
      dispatch(clearCart(cartId))
        .unwrap()
        .then(() => {
          setShowClearCartConfirm(false);
          dispatch(showNotification('success', 'Cart cleared successfully'));
        })
        .catch((error) => {
          console.error('Error clearing cart:', error);
          dispatch(showNotification('error', 'Error clearing cart'));
        });
    }
  };

  const handlePlaceOrder = () => {
    if (!cartId || cartItems.length === 0) return;
    dispatch(placeOrder(cartId))
      .unwrap()
      .then((orderData) => {
        dispatch(showNotification('success', 'Order placed successfully!'));
      })
      .catch((error) => {
        console.error('Error placing order:', error);
        dispatch(showNotification('error', 'Error placing order'));
      });
  };

  const handleViewCustomerOrders = (customer) => {
    setSelectedCustomerForOrders(customer);
    setCustomerOrdersModalOpen(true);
    setCustomerModalOpen(false);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(false);
  };

  return (
    <div className="cart-panel">
      <div className="cart-user">
        <div className="user-icon"><FaUserCircle /></div>
        <div className="user-info">
          {selectedCustomer ? (
            <>
              <div className="user-name">{selectedCustomer.name}</div>
              <div className="user-email">{selectedCustomer.email}</div>
              <div className="user-phone">{selectedCustomer.phone}</div>
              <div className="user-orders">Orders: {selectedCustomer.orders}</div>
            </>
          ) : (
            <>
              <div className="user-name">No customer selected</div>
            </>
          )}
        </div>
        <button
          className="add-to-cart-btn"
          style={{marginLeft: 12, padding: '8px 12px', fontSize: 14}}
          onClick={() => setCustomerModalOpen(true)}
        >
          {selectedCustomer ? 'Change' : 'Add'}
        </button>
      </div>

      <CustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelect={handleCustomerSelect}
        customers={formattedCustomers}
        onViewOrders={handleViewCustomerOrders}
      />

      <CustomerOrdersModal
        open={customerOrdersModalOpen}
        onClose={() => setCustomerOrdersModalOpen(false)}
        customer={selectedCustomerForOrders}
      />

      <div className="cart-list">
        <div className="cart-header">
          <h3>Cart Items</h3>
        </div>
        {cartItems.length === 0 && (
          <EmptyState
            icon={<FaShoppingCart />}
            title="Cart is empty"
            message="Add some products to get started"
          />
        )}
        {cartItems.map(item => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item-info">
              <div className="cart-item-name">{item.product.name}</div>
              <div className="cart-item-qty">
                <button
                  className="qty-btn"
                  onClick={() => handleQuantityChange(item, -1)}
                  disabled={item.quantity <= 1}
                >
                  <FaMinus />
                </button>
                <span>{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => handleQuantityChange(item, 1)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            <div className="cart-item-price">${item.prices.price.value.toFixed(2)}</div>
            <button
              className="remove-btn"
              onClick={() => handleRemoveItem(item)}
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      <button
        className="clear-cart-btn"
        onClick={() => setShowClearCartConfirm(true)}
        disabled={cartItems.length === 0}
      >
        🗑️ Clear Cart
      </button>

      {showClearCartConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Clear Cart?</h3>
            <p>Are you sure you want to remove all items from the cart?</p>
            <div style={{display:'flex',gap:12,marginTop:16}}>
              <button
                className="hold-btn"
                style={{background:'var(--danger)',color:'#fff'}}
                onClick={handleClearCart}
              >
                Yes, Clear
              </button>
              <button
                className="proceed-btn"
                onClick={() => setShowClearCartConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="order-summary">
        <div className="summary-row">
          <span>Sub total</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="summary-row payable">
          <span>Payable Amount</span>
          <span>${payable.toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button
          className="proceed-btn"
          onClick={handlePlaceOrder}
          disabled={cartItems.length === 0 || isPlacingOrder}
        >
          {isPlacingOrder ? <LoadingSpinner size="small" text="" /> : <FaCheck />} Place Order
        </button>
      </div>

      {orderNumber && (
        <div className="order-success">
          <div className="order-success-header">
            <div className="order-success-icon">
              <FaCheck />
            </div>
            <div>
              <h3 className="order-success-title">Order Placed Successfully!</h3>
              <p className="order-success-subtitle">Your order has been processed and confirmed</p>
            </div>
          </div>

          <div className="order-number-display">
            <div className="order-number-label">Order Number</div>
            <div className="order-number-value">#{orderNumber}</div>
          </div>

          <div className="order-success-actions">
            <button
              className="order-success-btn"
              onClick={handlePlaceOrder}
            >
              <FaPrint /> Print Receipt
            </button>
            <button
              className="order-success-btn secondary"
              onClick={() => {
                // Clear the order number to hide this notification
                dispatch(clearOrderNumber());
              }}
            >
              <FaTimes /> Dismiss
            </button>
          </div>

          <div className="order-success-details">
            <div>Order placed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
            {selectedCustomer && (
              <div>Customer: {selectedCustomer.name}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPanel;
