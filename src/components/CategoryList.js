import React from 'react';
import { useSelector } from 'react-redux';
import { selectCategories } from '../store/dataSlice';
import { FaSpinner } from 'react-icons/fa';

const CategoryList = ({ category, setCategory }) => {
  const categories = useSelector(selectCategories);

  if (categories.isLoading) {
    return (
      <div className="category-list loading">
        <FaSpinner className="spinner" />
        <span>Loading categories...</span>
      </div>
    );
  }

  if (categories.error) {
    return (
      <div className="category-list error">
        <span>Error: {categories.error}</span>
      </div>
    );
  }

  return (
    <div className="category-list">
      <div className="category-grid">
        <div className="category-menu">
            {categories?.items?.map((cat, idx) => (
                <button
                key={cat.id}
                className={`category-btn${category === cat.id ? ' active' : ''}`}
                onClick={() => setCategory(cat.id)}
                >
                {cat.name}
                {cat.children_count > 0 && cat.name === 'More' && (
                    <span className="badge">{cat.children_count}</span>
                )}
                </button>
            ))}
            </div>
      </div>
    </div>
  );
};

export default CategoryList;
