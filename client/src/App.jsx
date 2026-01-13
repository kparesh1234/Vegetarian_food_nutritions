import { useState, useRef } from 'react'
import NutritionResult from './components/NutritionResult'

const VEGETARIAN_FOODS = {
  'Indian': [
    'Aloo Gobi',
    'Aloo Paratha',
    'Bhindi Masala',
    'Chana Masala',
    'Chole Bhature',
    'Dal Makhani',
    'Dal Tadka',
    'Dosa',
    'Gulab Jamun',
    'Idli',
    'Jalebi',
    'Kadhi',
    'Kheer',
    'Lassi',
    'Malai Kofta',
    'Masala Chai',
    'Matar Paneer',
    'Naan',
    'Palak Paneer',
    'Paneer Butter Masala',
    'Paneer Tikka',
    'Pani Puri',
    'Pav Bhaji',
    'Rajma',
    'Rasgulla',
    'Roti',
    'Samosa',
    'Shahi Paneer',
    'Vada',
    'Vegetable Biryani',
  ],
  'Chinese': [
    'Chilli Paneer',
    'Crispy Honey Chilli Potatoes',
    'Fried Rice (Vegetable)',
    'Gobi Manchurian',
    'Hakka Noodles (Vegetable)',
    'Hot and Sour Soup',
    'Manchow Soup',
    'Paneer Manchurian',
    'Spring Rolls (Vegetable)',
    'Stir Fried Vegetables',
    'Sweet Corn Soup',
    'Szechuan Fried Rice',
    'Tofu in Black Bean Sauce',
    'Vegetable Chow Mein',
    'Vegetable Dumplings',
  ],
  'Thai': [
    'Drunken Noodles with Tofu',
    'Green Curry (Vegetable)',
    'Mango Sticky Rice',
    'Massaman Curry (Vegetable)',
    'Pad See Ew with Tofu',
    'Pad Thai (Vegetable)',
    'Papaya Salad',
    'Pineapple Fried Rice',
    'Red Curry (Vegetable)',
    'Sticky Rice',
    'Thai Basil Tofu',
    'Thai Coconut Soup',
    'Thai Fried Rice',
    'Thai Spring Rolls',
    'Tom Yum Soup (Vegetable)',
    'Vegetable Satay',
    'Yellow Curry (Vegetable)',
  ],
  'Mexican': [
    'Bean Burrito',
    'Black Bean Soup',
    'Cheese Enchiladas',
    'Cheese Quesadilla',
    'Chilaquiles',
    'Chips and Guacamole',
    'Churros',
    'Elote (Mexican Street Corn)',
    'Huevos Rancheros',
    'Mexican Rice',
    'Nachos',
    'Refried Beans',
    'Salsa and Chips',
    'Vegetable Fajitas',
    'Veggie Tacos',
  ],
  'American': [
    'Apple Pie',
    'Baked Potato',
    'Caesar Salad',
    'Cheese Pizza',
    'Chocolate Brownie',
    'Coleslaw',
    'French Fries',
    'Grilled Cheese Sandwich',
    'Mac and Cheese',
    'Mashed Potatoes',
    'Onion Rings',
    'Pancakes',
    'Peanut Butter Jelly Sandwich',
    'Veggie Burger',
    'Waffles',
  ],
  'Italian': [
    'Bruschetta',
    'Caprese Salad',
    'Eggplant Parmesan',
    'Fettuccine Alfredo',
    'Garlic Bread',
    'Gnocchi',
    'Margherita Pizza',
    'Minestrone Soup',
    'Mushroom Risotto',
    'Pasta Primavera',
    'Penne Arrabiata',
    'Ravioli (Cheese/Spinach)',
    'Spaghetti Marinara',
    'Tiramisu',
    'Vegetable Lasagna',
  ],
  'Other': [
    'Falafel (Middle Eastern)',
    'Greek Salad',
    'Hummus with Pita',
    'Japanese Vegetable Tempura',
    'Korean Bibimbap (Vegetable)',
    'Mediterranean Mezze Platter',
    'Spanakopita (Greek)',
    'Sushi Rolls (Vegetable)',
    'Tabbouleh',
    'Vietnamese Spring Rolls',
  ],
}

function App() {
  const [inputMode, setInputMode] = useState('image') // 'image' or 'manual'
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mimeType, setMimeType] = useState(null)
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedFood, setSelectedFood] = useState('')
  const [customFood, setCustomFood] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setError(null)
    setResult(null)
    setMimeType(file.type)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      setImage(base64)
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      let body = {}

      if (inputMode === 'image') {
        if (!image) return
        body = { image, mimeType }
      } else {
        const foodName = selectedFood === 'other' ? customFood : selectedFood
        if (!foodName) {
          setError('Please select or enter a food item')
          setLoading(false)
          return
        }
        body = { foodName, amount: amount || '1 serving' }
      }

      const apiUrl = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setImage(null)
    setPreview(null)
    setMimeType(null)
    setSelectedCuisine('')
    setSelectedFood('')
    setCustomFood('')
    setAmount('')
    setResult(null)
    setError(null)
  }

  const handleCuisineChange = (cuisine) => {
    setSelectedCuisine(cuisine)
    setSelectedFood('')
  }

  const canSubmit = inputMode === 'image'
    ? image
    : (selectedFood && (selectedFood !== 'other' || customFood))

  return (
    <div className="container">
      <h1>Food Nutrition Calculator</h1>
      <p className="subtitle">Get nutrition estimates for vegetarian cuisine worldwide</p>

      <div className="mode-toggle">
        <button
          className={`mode-btn ${inputMode === 'image' ? 'active' : ''}`}
          onClick={() => setInputMode('image')}
        >
          Upload Image
        </button>
        <button
          className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
          onClick={() => setInputMode('manual')}
        >
          Select Food
        </button>
      </div>

      {inputMode === 'image' ? (
        <>
          <div
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="icon">📷</div>
            <p>Click or drag & drop an image here</p>
            <p style={{ fontSize: '0.85rem', color: '#999' }}>Supports JPG, PNG, WebP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>

          {preview && (
            <div className="preview-container">
              <img src={preview} alt="Food preview" className="preview-image" />
            </div>
          )}
        </>
      ) : (
        <div className="manual-input">
          <div className="input-group">
            <label>Select Cuisine</label>
            <select
              value={selectedCuisine}
              onChange={(e) => handleCuisineChange(e.target.value)}
              className="food-select"
            >
              <option value="">-- Select a cuisine --</option>
              {Object.keys(VEGETARIAN_FOODS).map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>

          {selectedCuisine && (
            <div className="input-group">
              <label>Select Food</label>
              <select
                value={selectedFood}
                onChange={(e) => setSelectedFood(e.target.value)}
                className="food-select"
              >
                <option value="">-- Select a dish --</option>
                {VEGETARIAN_FOODS[selectedCuisine].map(food => (
                  <option key={food} value={food}>{food}</option>
                ))}
                <option value="other">Other (type below)</option>
              </select>
            </div>
          )}

          {selectedFood === 'other' && (
            <div className="input-group">
              <label>Enter Food Name</label>
              <input
                type="text"
                value={customFood}
                onChange={(e) => setCustomFood(e.target.value)}
                placeholder="e.g., Malai Kofta"
                className="text-input"
              />
            </div>
          )}

          {selectedFood && (
            <div className="input-group">
              <label>Amount / Quantity</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 1 plate, 2 pieces, 200g"
                className="text-input"
              />
            </div>
          )}
        </div>
      )}

      {canSubmit && !loading && (
        <button className="submit-btn" onClick={handleSubmit}>
          Analyze Nutrition
        </button>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: '#666' }}>Analyzing your food...</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {result && <NutritionResult data={result} />}

      {(preview || result || selectedCuisine) && !loading && (
        <button className="clear-btn" onClick={handleClear}>
          Clear & Start Over
        </button>
      )}
    </div>
  )
}

export default App
