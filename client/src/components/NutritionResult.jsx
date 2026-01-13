import { memo } from 'react'
import PropTypes from 'prop-types'

const NutritionResult = memo(function NutritionResult({ data }) {
  const { foodName, description, servingSize, nutrition, confidence } = data

  return (
    <div className="results">
      <h2>Nutrition Analysis</h2>
      <p className="food-name">{foodName}</p>

      {servingSize && (
        <p className="serving-size">
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
          <div className="value confidence-value">
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
})

NutritionResult.propTypes = {
  data: PropTypes.shape({
    foodName: PropTypes.string.isRequired,
    description: PropTypes.string,
    servingSize: PropTypes.string,
    nutrition: PropTypes.shape({
      calories: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      protein: PropTypes.number.isRequired,
      carbohydrates: PropTypes.number.isRequired,
      fat: PropTypes.number.isRequired,
      fiber: PropTypes.number.isRequired,
    }).isRequired,
    confidence: PropTypes.string.isRequired,
  }).isRequired,
}

export default NutritionResult
