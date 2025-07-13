import React, { useState } from 'react';
import CategoryList from './CategoryList';
import ProductList from './ProductList';

const CategoryProductView = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    console.log('Selected category:', category);
  };

  const handleAddToCart = (product) => {
    console.log('Adding to cart:', product);
    // You can implement cart functionality here
    alert(`Added ${product.name} to cart!`);
  };

  return (
    <div className="category-product-view">
      <div className="view-container">
        <div className="sidebar">
          <CategoryList
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </div>

        <div className="main-content">
          <ProductList
            selectedCategory={selectedCategory}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>

      <style jsx>{`
        .category-product-view {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .view-container {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .sidebar {
          position: sticky;
          top: 20px;
          height: fit-content;
        }

        .main-content {
          min-height: 500px;
        }

        @media (max-width: 768px) {
          .view-container {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .sidebar {
            position: static;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryProductView;
