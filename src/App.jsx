import { useState, useRef, useCallback } from 'react'
import './App.css'

// API URL - uses environment variable in Docker, falls back to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      // Create FormData and upload directly
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Analysis failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to analyze image. Please check the backend connection.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">🔍</div>
            <span className="logo-text">Image Detector</span>
          </div>
          <div className="header-badge">
            <span className="status-dot"></span>
            <span>AI Powered</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero">
          <h1>Detect Image Images</h1>
          <p>
            Leverage advanced AI and Error Level Analysis (ELA) to identify
            manipulated or AI-generated images with high accuracy.
          </p>
        </section>

        {/* Upload Section */}
        <section className="upload-section">
          <div
            className={`upload-card ${isDragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📤</div>
            <h2 className="upload-title">Drop your image here</h2>
            <p className="upload-subtitle">or click to browse from your computer</p>
            <div className="upload-formats">
              <span className="format-badge">JPG</span>
              <span className="format-badge">PNG</span>
              <span className="format-badge">JPEG</span>
              <span className="format-badge">WEBP</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={handleInputChange}
            />
          </div>
        </section>

        {/* Preview Section */}
        {selectedFile && (
          <section className="preview-section">
            <div className="preview-card">
              <div className="preview-header">
                <span className="preview-title">
                  🖼️ Image Preview
                </span>
                <div className="preview-actions">
                  <button className="btn-icon" onClick={clearSelection} title="Remove">
                    ✕
                  </button>
                </div>
              </div>
              <div className="preview-body">
                <div className="preview-image-container">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="preview-image"
                  />
                </div>
                <div className="preview-info">
                  <div className="info-item">
                    <div className="info-label">Filename</div>
                    <div className="info-value">{selectedFile.name}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">File Size</div>
                    <div className="info-value">{formatFileSize(selectedFile.size)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">File Type</div>
                    <div className="info-value">{selectedFile.type}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Last Modified</div>
                    <div className="info-value">
                      {new Date(selectedFile.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verify Button - Shown when image is selected */}
            <div className="analyze-section">
              <button
                className="btn-analyze"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    🔬 Verify Authenticity
                  </>
                )}
              </button>
              <p className="analyze-hint">
                Click to analyze the image using AI-powered Image detection
              </p>
            </div>
          </section>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <section className="results-section">
            <div className={`result-card ${result.prediction.toLowerCase()}`}>
              <div className={`result-header ${result.prediction.toLowerCase()}`}>
                <div className={`result-icon ${result.prediction.toLowerCase()}`}>
                  {result.prediction === 'Real' ? '✓' : '⚠'}
                </div>
                <h2 className={`result-title ${result.prediction.toLowerCase()}`}>
                  {result.prediction === 'Real' ? 'Authentic Image' : 'Image Detected'}
                </h2>
                <p className="result-subtitle">
                  {result.prediction === 'Real'
                    ? 'This image appears to be genuine and unmanipulated.'
                    : 'This image shows signs of manipulation or AI generation.'}
                </p>
              </div>
              <div className="result-body">
                <div className="confidence-section">
                  <div className="confidence-header">
                    <span className="confidence-label">Confidence Level</span>
                    <span className="confidence-value">{result.confidence.toFixed(2)}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className={`confidence-fill ${result.prediction.toLowerCase()}`}
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>
                <div className="probabilities-grid">
                  <div className="probability-item">
                    <div className="probability-label">Real Probability</div>
                    <div className="probability-value real">
                      {result.probabilities.real.toFixed(2)}%
                    </div>
                  </div>
                  <div className="probability-item">
                    <div className="probability-label">Fake Probability</div>
                    <div className="probability-value fake">
                      {result.probabilities.fake.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section className="how-it-works">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Upload Image</h3>
              <p>Drag and drop or click to select an image you want to verify</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>AI Analysis</h3>
              <p>Our model uses Error Level Analysis (ELA) to detect manipulations</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Get Results</h3>
              <p>Receive instant feedback with confidence scores</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          Built with ❤️ using React & FastAPI |
          Powered by TensorFlow & Error Level Analysis
        </p>
      </footer>
    </div>
  )
}

export default App
