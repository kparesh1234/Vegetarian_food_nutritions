import { useState, useCallback, useMemo } from 'react'
import NutritionResult from './components/NutritionResult'
import { VEGETARIAN_FOODS } from './data/vegetarianFoods'
import { useImageUpload } from './hooks/useImageUpload'
import { useNutritionAnalyzer } from './hooks/useNutritionAnalyzer'

function App() {
  const [inputMode, setInputMode] = useState('image')
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedFood, setSelectedFood] = useState('')
  const [customFood, setCustomFood] = useState('')
  const [amount, setAmount] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const {
    image,
    preview,
    mimeType,
    error: imageError,
    fileInputRef,
    handleFileSelect,
    clearImage,
    openFilePicker,
    setError: setImageError,
  } = useImageUpload()

  const {
    loading,
    error: analyzeError,
    result,
    analyze,
    clearResult,
    setError: setAnalyzeError,
  } = useNutritionAnalyzer()

  const error = imageError || analyzeError

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleClick = useCallback(() => {
    openFilePicker()
  }, [openFilePicker])

  const handleCuisineChange = useCallback((cuisine) => {
    setSelectedCuisine(cuisine)
    setSelectedFood('')
  }, [])

  const handleFoodChange = useCallback((food) => {
    setSelectedFood(food)
  }, [])

  const handleCustomFoodChange = useCallback((value) => {
    setCustomFood(value)
  }, [])

  const handleAmountChange = useCallback((value) => {
    setAmount(value)
  }, [])

  const handleModeChange = useCallback((mode) => {
    setInputMode(mode)
  }, [])

  const handleSubmit = useCallback(async () => {
    let body = {}

    if (inputMode === 'image') {
      if (!image) return
      body = { image, mimeType }
    } else {
      const foodName = selectedFood === 'other' ? customFood : selectedFood
      if (!foodName) {
        setAnalyzeError('Please select or enter a food item')
        return
      }
      body = { foodName, amount: amount || '1 serving' }
    }

    try {
      await analyze(body)
    } catch {
      // Error is handled in the hook
    }
  }, [inputMode, image, mimeType, selectedFood, customFood, amount, analyze, setAnalyzeError])

  const handleClear = useCallback(() => {
    clearImage()
    clearResult()
    setSelectedCuisine('')
    setSelectedFood('')
    setCustomFood('')
    setAmount('')
  }, [clearImage, clearResult])

  const canSubmit = useMemo(() =>
    inputMode === 'image'
      ? image
      : (selectedFood && (selectedFood !== 'other' || customFood)),
    [inputMode, image, selectedFood, customFood]
  )

  const handleFileInputChange = useCallback((e) => {
    handleFileSelect(e.target.files[0])
  }, [handleFileSelect])

  return (
    <div className="container">
      <h1>Food Nutrition Calculator</h1>
      <p className="subtitle">Get nutrition estimates for vegetarian cuisine worldwide</p>

      <div className="mode-toggle">
        <button
          className={`mode-btn ${inputMode === 'image' ? 'active' : ''}`}
          onClick={() => handleModeChange('image')}
        >
          Upload Image
        </button>
        <button
          className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
          onClick={() => handleModeChange('manual')}
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
            role="button"
            tabIndex={0}
            aria-label="Upload food image"
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
          >
            <div className="icon">📷</div>
            <p>Click or drag & drop an image here</p>
            <p className="upload-hint">Supports JPG, PNG, WebP (max 10MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden-input"
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
                onChange={(e) => handleFoodChange(e.target.value)}
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
                onChange={(e) => handleCustomFoodChange(e.target.value)}
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
                onChange={(e) => handleAmountChange(e.target.value)}
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
          <p className="loading-text">Analyzing your food...</p>
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
