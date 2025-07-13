import React, { useState } from 'react';

const CustomerModal = ({ open, onClose, onSelect, customers, onViewOrders }) => {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal customer-modal">
        <div className="modal-header">
          <h2>Select Customer</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="search-container">
            <input
              className="search-input"
              placeholder="Search customer by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="search-icon">🔍</div>
          </div>

          <div className="customer-list-container">
            {filtered.length > 0 ? (
              <div className="customer-list">
                {filtered.map(customer => (
                  <div
                    key={customer.id}
                    className="customer-item"
                  >
                    <div className="customer-avatar">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="customer-details">
                      <div className="customer-name">{customer.name}</div>
                      <div className="customer-info">
                        <span className="customer-email">{customer.email}</span>
                        <span className="customer-phone">{customer.phone}</span>
                      </div>
                      <div className="customer-stats">
                        <span className="orders-badge">
                          {customer.orders} order{customer.orders !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="customer-actions">
                      {onViewOrders && customer.orders > 0 && (
                        <button
                          className="view-orders-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewOrders(customer);
                          }}
                          title="View Orders"
                        >
                          📋
                        </button>
                      )}
                      <div
                        className="customer-select-icon"
                        onClick={() => { onSelect(customer); onClose(); }}
                      >
                        →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-title">No customers found</div>
                <div className="empty-message">
                  {search ? 'Try adjusting your search terms' : 'No customers available'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
