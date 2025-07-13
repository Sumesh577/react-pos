import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { logoutUser } from '../store/authSlice';
import { selectUser } from '../store/authSlice';
import { selectToken } from '../store/authSlice';
import {
  createCart,
  fetchCart,
  selectCartItems,
  selectCartTotal,
  selectCartId,
  selectCartLoading,
  selectOrderNumber,
  selectIsPlacingOrder,
} from '../store/cartSlice';
import { selectProducts, selectCategories, fetchProducts, fetchCategories, fetchAllData } from '../store/dataSlice';
import { showNotification } from '../store/notificationSlice';
import CategoryList from './CategoryList';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ProductList from './ProductList';
import CartPanel from './CartPanel';
import Notification from './Notification';

const POSMain = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);

  // Redux Cart State
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const cartId = useSelector(selectCartId);
  const cartLoading = useSelector(selectCartLoading);
  const orderNumber = useSelector(selectOrderNumber);
  const isPlacingOrder = useSelector(selectIsPlacingOrder);

  const token = useSelector(selectToken);

  // Redux Data State
  const { items: products, isLoading: productsLoading, error: productsError } = useSelector(selectProducts);
  const { items: categories, isLoading: categoriesLoading } = useSelector(selectCategories);

  // Local State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const [orderHistory, setOrderHistory] = useState([]);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);

  // UI/UX State
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');

  // Cart fetching is now handled in auth slice after cart creation

  useEffect(() => {
    if (token) {
        dispatch(fetchAllData());
        dispatch(createCart()).unwrap().then((cartResult) => {
            if (cartResult) {
                dispatch(fetchCart(cartResult));
            }
        });
    }
  }, [token, dispatch]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Helper Functions
  const showNotificationMessage = (message, type = 'success') => {
    dispatch(showNotification(type, message));
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !category ||
      product.categories?.some(cat => cat.name === category);

    return matchesSearch && matchesCategory;
  });

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  // Event Handlers
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCategory('');
  };

  const handleNavClick = (nav) => {
    setActiveNav(nav);
    setShowMobileMenu(false);
    if (nav === 'Refresh') {
      dispatch(fetchProducts({ pageSize: 50, currentPage: 1 }));
      showNotificationMessage('Products refreshed');
    } else if (nav === 'Orders') {
      setOrderHistoryOpen(true);
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setCategory('');
  };

  return (
    <div className={`app-container${isMobile ? ' mobile' : ''}`}>
      {/* Notifications */}
      <Notification />

      {/* Mobile Menu Toggle */}
      {isMobile && (
        <button
          className="mobile-menu-toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <FaBars />
        </button>
      )}

      {/* Sidebar */}
      <Sidebar
        isMobile={isMobile}
        showMobileMenu={showMobileMenu}
        activeNav={activeNav}
        currentUser={currentUser}
        onMobileMenuClose={() => setShowMobileMenu(false)}
        onNavClick={handleNavClick}
        onLogout={handleLogout}
      />

      {/* Main Area */}
      <div className="main-area">
        {/* Topbar */}
        <Topbar
          search={search}
          isMobile={isMobile}
          onSearchChange={handleSearchChange}
        />

        {/* Category Menu */}
        <CategoryList category={category} setCategory={setCategory} />

        {/* Content Area */}
        <div className="content-area">
          {/* Product List */}
          <ProductList
            loading={productsLoading}
            error={productsError}
            sortedProducts={filteredProducts}
            search={search}
            category={category}
            onRetry={() => dispatch(fetchProducts({ pageSize: 50, currentPage: 1 }))}
            onClearSearch={handleClearSearch}
            refetch={() => dispatch(fetchProducts({ pageSize: 50, currentPage: 1 }))}
          />

          {/* Cart Panel */}
          <CartPanel />
        </div>
      </div>

    </div>
  );
};

export default POSMain;
