import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUserCircle, FaShoppingCart, FaPlus, FaMinus, FaTrash, FaSync, FaCheck, FaPrint } from 'react-icons/fa';
import { addToCart, removeFromCart, updateQuantity, clearCart, placeOrder, fetchCart } from '../store/cartSlice';
import { showNotification } from '../store/notificationSlice';
import { selectCustomers } from '../store/dataSlice';
import CustomerModal from './CustomerModal';
import CustomerOrdersModal from './CustomerOrdersModal';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

const CartPanel = ({
  selectedCustomer,
  customerModalOpen,
  tax,
  payable,
  onCustomerModalOpen,
  onCustomerModalClose,
  onCustomerSelect,
  onDownloadReceipt
}) => {
  const dispatch = useDispatch();
  const { items: cartItems, total: cartTotal, id: cartId, isLoading: isPlacingOrder, orderNumber } = useSelector(state => state.cart);
  const { items: customers, isLoading: customersLoading } = useSelector(selectCustomers);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [customerOrdersModalOpen, setCustomerOrdersModalOpen] = useState(false);
  const [selectedCustomerForOrders, setSelectedCustomerForOrders] = useState(null);

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

//   const handleQuantityChange = (item, delta) => {
//     const newQuantity = item.quantity + delta;
//     if (newQuantity > 0) {
//       dispatch(updateQuantity({ itemId: item.id, quantity: newQuantity }));
//     }
//   };

  const handleRemoveItem = (item) => {
    dispatch(removeFromCart(item.id));
    dispatch(showNotification('success', 'Item removed from cart'));
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
        // Generate receipt text
        const receiptText = `Order #${orderData.order_number}\nDate: ${new Date().toLocaleString()}\nCustomer: ${selectedCustomer ? selectedCustomer.name : 'N/A'}\nItems:\n${cartItems.map(i => `- ${i.product.name} x${i.quantity} $${i.prices.price.value.toFixed(2)}`).join('\n')}\nTotal: $${cartTotal.toFixed(2)}`;

        // Call the download receipt function with the generated receipt
        if (onDownloadReceipt) {
          // Create a temporary receipt object for download
          const tempReceipt = { text: receiptText, orderNumber: orderData.order_number };
          onDownloadReceipt(tempReceipt);
        }
      })
      .catch((error) => {
        console.error('Error placing order:', error);
        dispatch(showNotification('error', 'Error placing order'));
      });
  };

  const handleRefreshCart = () => {
    if (cartId) {
      dispatch(fetchCart(cartId));
    }
  };

  const handleViewCustomerOrders = (customer) => {
    setSelectedCustomerForOrders(customer);
    setCustomerOrdersModalOpen(true);
    onCustomerModalClose(); // Close the customer selection modal
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
          onClick={onCustomerModalOpen}
        >
          {selectedCustomer ? 'Change' : 'Add'}
        </button>
      </div>

      <CustomerModal
        open={customerModalOpen}
        onClose={onCustomerModalClose}
        onSelect={onCustomerSelect}
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
          <button
            className="refresh-cart-btn"
            onClick={handleRefreshCart}
            title="Refresh cart"
          >
            <FaSync />
          </button>
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
          <FaCheck /> Order Placed! Order Number: {orderNumber}
          <button
            className="hold-btn"
            style={{marginTop:8}}
            onClick={onDownloadReceipt}
          >
            <FaPrint /> Print/Download Receipt
          </button>
        </div>
      )}
    </div>
  );
};

export default CartPanel;
