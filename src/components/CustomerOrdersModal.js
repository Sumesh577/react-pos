import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaTimes, FaCalendar, FaDollarSign, FaBox, FaTruck, FaCheck, FaClock } from 'react-icons/fa';
import { fetchCustomerOrders, clearCustomerOrders } from '../store/dataSlice';
import { selectCustomerOrders } from '../store/dataSlice';
import LoadingSpinner from './LoadingSpinner';

const CustomerOrdersModal = ({ open, onClose, customer }) => {
  const dispatch = useDispatch();
  const { customer: customerData, orders, isLoading, error } = useSelector(selectCustomerOrders);

  useEffect(() => {
    if (open && customer) {
      dispatch(fetchCustomerOrders({ customerId: customer.id, pageSize: 20, currentPage: 1 }));
    }

    return () => {
      if (!open) {
        dispatch(clearCustomerOrders());
      }
    };
  }, [open, customer, dispatch]);

  if (!open) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'completed':
        return <FaCheck className="status-icon completed" />;
      case 'processing':
      case 'pending':
        return <FaClock className="status-icon processing" />;
      case 'shipped':
        return <FaTruck className="status-icon shipped" />;
      default:
        return <FaBox className="status-icon default" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'completed':
        return 'var(--success)';
      case 'processing':
      case 'pending':
        return '#f39c12';
      case 'shipped':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal customer-orders-modal">
        <div className="modal-header">
          <div className="header-content">
            <h2>Customer Orders</h2>
            {customerData && (
              <div className="customer-info">
                <div className="customer-name">{customerData.firstname} {customerData.lastname}</div>
                <div className="customer-email">{customerData.email}</div>
              </div>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="loading-container">
              <LoadingSpinner />
              <p>Loading orders...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <div className="error-title">Error Loading Orders</div>
              <div className="error-message">{error}</div>
              <button
                className="retry-btn"
                onClick={() => dispatch(fetchCustomerOrders({ customerId: customer.id, pageSize: 20, currentPage: 1 }))}
              >
                Try Again
              </button>
            </div>
          ) : orders?.items?.length > 0 ? (
            <div className="orders-container">
              <div className="orders-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Orders:</span>
                  <span className="summary-value">{orders.total_count}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Spent:</span>
                  <span className="summary-value">
                    ${orders.items.reduce((total, order) => total + parseFloat(order.grand_total.value), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="orders-list">
                {orders.items.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <div className="order-number">
                        <FaBox />
                        Order #{order.order_number}
                      </div>
                      <div className="order-status" style={{ color: getStatusColor(order.status) }}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </div>

                    <div className="order-details">
                      <div className="order-date">
                        <FaCalendar />
                        {formatDate(order.created_at)}
                      </div>
                      <div className="order-total">
                        <FaDollarSign />
                        ${order.grand_total.value}
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="order-items">
                        <div className="items-header">Items:</div>
                        <div className="items-list">
                          {order.items.slice(0, 3).map(item => (
                            <div key={item.id} className="item">
                              <span className="item-name">{item.product_name}</span>
                              <span className="item-qty">x{item.quantity_ordered}</span>
                              <span className="item-price">${item.price.value}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="more-items">
                              +{order.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div className="empty-title">No Orders Found</div>
              <div className="empty-message">
                This customer hasn't placed any orders yet.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersModal;
