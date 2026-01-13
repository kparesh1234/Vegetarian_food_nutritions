function NutritionResult({ data }) {
  const { foodName, description, servingSize, nutrition, confidence } = data

  return (
    <div className="results">
      <h2>Nutrition Analysis</h2>
      <p className="food-name">{foodName}</p>

      {servingSize && (
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>
          Serving size: {servingSize}
        </p>
      )}

      <div className="nutrition-grid">
        <div className="nutrition-item">
          <div className="value">{nutrition.calories}</div>
          <div className="label">Calories</div>
        </div>
        <div className="nutrition-item">
          <div className="value">{nutrition.protein}g</div>
          <div className="label">Protein</div>
        </div>
        <div className="nutrition-item">
          <div className="value">{nutrition.carbohydrates}g</div>
          <div className="label">Carbs</div>
        </div>
        <div className="nutrition-item">
          <div className="value">{nutrition.fat}g</div>
          <div className="label">Fat</div>
        </div>
        <div className="nutrition-item">
          <div className="value">{nutrition.fiber}g</div>
          <div className="label">Fiber</div>
        </div>
        <div className="nutrition-item">
          <div className="value" style={{ fontSize: '1rem', textTransform: 'capitalize' }}>
            {confidence}
          </div>
          <div className="label">Confidence</div>
        </div>
      </div>

      {description && (
        <div className="description">
          <strong>About this dish:</strong> {description}
        </div>
      )}
    </div>
  )
}

export default NutritionResult
