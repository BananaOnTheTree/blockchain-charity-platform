import React from 'react';
import '../../styles/wizard/CategorySelector.css';

export const CAMPAIGN_CATEGORIES = [
  { value: 'Animal Welfare', icon: '🐾', label: 'Animal Welfare' },
  { value: 'Education', icon: '🎓', label: 'Education' },
  { value: 'Community', icon: '👥', label: 'Community' },
  { value: 'Emergency Relief', icon: '🚨', label: 'Emergency Relief' },
  { value: 'Entrepreneurship', icon: '💼', label: 'Entrepreneurship' },
  { value: 'Event', icon: '📅', label: 'Event' },
  { value: 'Funeral', icon: '⚰️', label: 'Funeral' },
  { value: 'Healthcare', icon: '⚕️', label: 'Healthcare' },
  { value: 'Housing', icon: '🏠', label: 'Housing' },
  { value: 'Human Rights', icon: '✊', label: 'Human Rights' },
  { value: 'Food', icon: '🍽️', label: 'Food' },
  { value: 'Environment', icon: '🌱', label: 'Nature & Environment' },
  { value: 'Refugees', icon: '🌍', label: 'Refugees' },
  { value: 'Religion', icon: '🕊️', label: 'Religion' },
  { value: 'Sport', icon: '⚽', label: 'Sport' },
  { value: 'Volunteer', icon: '🤝', label: 'Volunteer' },
  { value: 'Wedding', icon: '💒', label: 'Wedding' },
  { value: 'Wish', icon: '⭐', label: 'Wish' },
  { value: 'Women Empowerment', icon: '👩', label: 'Women Empowerment' },
  { value: 'Travelling', icon: '✈️', label: 'Travelling' },
  { value: 'Other', icon: '💡', label: 'Other' }
];

const CategorySelector = ({ selectedCategory, onSelect }) => {
  return (
    <div className="form-group">
      <label>Category</label>
      <div className="category-grid">
        {CAMPAIGN_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={`category-btn ${selectedCategory === cat.value ? 'selected' : ''}`}
            onClick={() => onSelect(cat.value)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-label">{cat.label}</span>
          </button>
        ))}
      </div>
      <span className="helper-text">Select the category that best describes your campaign</span>
    </div>
  );
};

export default CategorySelector;
