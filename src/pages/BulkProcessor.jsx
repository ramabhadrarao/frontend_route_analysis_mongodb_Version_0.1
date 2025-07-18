import React, { useState } from 'react'
import { Download, FileText, Play, RefreshCw } from 'lucide-react'
import { apiService } from '../services/apiService'
import { generateCSVTemplate } from '../utils/helpers'
import { DATA_COLLECTION_OPTIONS } from '../utils/constants'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import FileUpload from '../components/BulkProcessor/FileUpload'
import ProcessingOptions from '../components/BulkProcessor/ProcessingOptions'
import ProcessingProgress from '../components/BulkProcessor/ProcessingProgress'
import ResultsViewer from '../components/BulkProcessor/ResultsViewer'
import toast from 'react-hot-toast'

const BulkProcessor = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [options, setOptions] = useState({
    mode: 'enhanced',
    concurrentRoutes: 3,
    backgroundProcessing: true,
    [DATA_COLLECTION_OPTIONS.SHARP_TURNS]: true,
    [DATA_COLLECTION_OPTIONS.BLIND_SPOTS]: true,
    [DATA_COLLECTION_OPTIONS.NETWORK_COVERAGE]: true,
    [DATA_COLLECTION_OPTIONS.ROAD_CONDITIONS]: true,
    [DATA_COLLECTION_OPTIONS.ACCIDENT_DATA]: true,
    [DATA_COLLECTION_OPTIONS.SEASONAL_WEATHER]: false,
    [DATA_COLLECTION_OPTIONS.EMERGENCY_SERVICES]: true,
    [DATA_COLLECTION_OPTIONS.TRAFFIC_DATA]: true
  })

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setResults(null)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const handleStartProcessing = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('options', JSON.stringify(options))

    try {
      setProcessing(true)
      setProgress({
        status: 'processing',
        currentRoute: 'Initializing...',
        totalRoutes: 0,
        completedRoutes: 0,
        failedRoutes: 0,
        estimatedTimeRemaining: 'Calculating...'
      })

      const response = options.mode === 'enhanced' 
        ? await apiService.bulkProcessor.processCSVEnhanced(formData)
        : await apiService.bulkProcessor.processCSV(formData)

      if (response.success) {
        // Start polling for progress
        pollProgress()
        toast.success('Processing started successfully!')
      } else {
        throw new Error(response.message || 'Processing failed')
      }
    } catch (error) {
      console.error('Processing error:', error)
      toast.error(error.message || 'Failed to start processing')
      setProcessing(false)
      setProgress(null)
    }
  }

  const pollProgress = async () => {
    try {
      const response = await apiService.bulkProcessor.getStatus()
      setProgress(response)

      if (response.status === 'completed') {
        setProcessing(false)
        setResults(response.results)
        toast.success('Processing completed successfully!')
      } else if (response.status === 'failed') {
        setProcessing(false)
        toast.error('Processing failed')
      } else {
        // Continue polling
        setTimeout(pollProgress, 2000)
      }
    } catch (error) {
      console.error('Status poll error:', error)
      setTimeout(pollProgress, 5000) // Retry after 5 seconds
    }
  }

  const handleStopProcessing = () => {
    setProcessing(false)
    setProgress(null)
    toast.success('Processing stopped')
  }

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate()
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'route_template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Template downloaded successfully!')
  }

  const handleDownloadResults = () => {
    if (results) {
      const csvData = results.routes.map(route => ({
        routeName: route.routeName,
        totalDistance: route.totalDistance,
        riskScore: route.riskScore,
        riskLevel: route.riskLevel,
        status: route.status
      }))

      const headers = Object.keys(csvData[0]).join(',')
      const rows = csvData.map(row => Object.values(row).join(','))
      const csv = [headers, ...rows].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `processing_results_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Results downloaded successfully!')
    }
  }

  const handleViewDetails = (routeId) => {
    window.open(`/routes/${routeId}`, '_blank')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Route Processor</h1>
          <p className="text-gray-600">Upload and process multiple routes with comprehensive risk analysis</p>
        </div>
        <Button
          variant="outline"
          icon={Download}
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload & Options */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onRemoveFile={handleRemoveFile}
            />
          </Card>

          <ProcessingOptions
            options={options}
            onUpdateOptions={setOptions}
          />

          <Card className="p-6">
            <Button
              variant="primary"
              size="lg"
              icon={Play}
              onClick={handleStartProcessing}
              disabled={!selectedFile || processing}
              loading={processing}
              className="w-full"
            >
              {processing ? 'Processing...' : 'Start Processing'}
            </Button>
          </Card>
        </div>

        {/* Right Column - Progress & Results */}
        <div className="space-y-6">
          {progress && (
            <ProcessingProgress
              progress={progress}
              onStop={handleStopProcessing}
            />
          )}

          {results && (
            <ResultsViewer
              results={results}
              onDownload={handleDownloadResults}
              onViewDetails={handleViewDetails}
            />
          )}

          {!progress && !results && (
            <Card className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Process</h3>
              <p className="text-gray-500">
                Upload a CSV file and configure your processing options to get started
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkProcessor