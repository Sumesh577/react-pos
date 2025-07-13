import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPlus, FaSearch } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { addToCart, selectCartId, selectCartLoading } from '../store/cartSlice';
import { showNotification } from '../store/notificationSlice';

const ProductList = ({
  loading,
  error,
  sortedProducts,
  search,
  category,
  onRetry,
  onClearSearch,
  refetch
}) => {
  const dispatch = useDispatch();
  const cartId = useSelector(selectCartId);
  const cartLoading = useSelector(selectCartLoading);

  const handleAddToCart = (product) => {
    if (!cartId || cartLoading) return;
    dispatch(addToCart({ cartId, sku: product.sku, quantity: 1 }))
      .unwrap()
      .then(() => {
        dispatch(showNotification('success', `${product.name} added to cart`));
      })
      .catch((error) => {
        console.error('Error adding to cart:', error);
        dispatch(showNotification('error', 'Error adding item to cart'));
      });
  };
  return (
    <div className="product-list">
      {loading && <LoadingSpinner text="Loading products..." />}
      {sortedProducts.length === 0 && !loading && !error && (
        <EmptyState
          icon={<FaSearch />}
          title="No products found"
          message="Try adjusting your search or filters"
          action={
            <button className="proceed-btn" onClick={onClearSearch}>
              Clear Search
            </button>
          }
        />
      )}
      {sortedProducts.map(product => (
        <div
          className={`product-card${product.stock_status !== 'IN_STOCK' ? ' out-of-stock' : ''}`}
          key={product.id}
        >
          <div className="product-image-container">
            <img
              className="product-image"
              src={product.image?.url || '/placeholder-product.png'}
              alt={product.name}
              onError={(e) => {
                e.target.src = '/placeholder-product.png';
              }}
            />
          </div>
          <div className="product-info">
            <div className="product-name">{product.name}</div>
            <div className="product-sku">SKU: {product.sku}</div>
            <div className="product-price">
              ${product.price_range.minimum_price.regular_price.value.toFixed(2)}
            </div>
          </div>
          <button
            className="add-to-cart-btn"
            onClick={() => handleAddToCart(product)}
            disabled={product.stock_status !== 'IN_STOCK' || cartLoading}
            title={product.stock_status === 'IN_STOCK' ? 'Add to Cart' : 'Out of Stock'}
          >
            {cartLoading ? '...' : <FaPlus />}
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
