import React from 'react'
import Card from '../UI/Card'
import Toggle from '../UI/Toggle'
import Select from '../UI/Select'
import { DATA_COLLECTION_OPTIONS } from '../../utils/constants'

const ProcessingOptions = ({ options, onUpdateOptions }) => {
  const handleToggle = (key, value) => {
    onUpdateOptions({ ...options, [key]: value })
  }

  const processingModes = [
    { value: 'basic', label: 'Basic Processing' },
    { value: 'enhanced', label: 'Enhanced Processing' }
  ]

  const concurrentOptions = [
    { value: 1, label: '1 Route' },
    { value: 2, label: '2 Routes' },
    { value: 3, label: '3 Routes' },
    { value: 4, label: '4 Routes' },
    { value: 5, label: '5 Routes' }
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Options</h3>
      
      <div className="space-y-6">
        <div>
          <Select
            label="Processing Mode"
            options={processingModes}
            value={options.mode}
            onChange={(e) => handleToggle('mode', e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">
            Enhanced mode provides comprehensive data collection and analysis
          </p>
        </div>

        <div>
          <Select
            label="Concurrent Routes"
            options={concurrentOptions}
            value={options.concurrentRoutes}
            onChange={(e) => handleToggle('concurrentRoutes', parseInt(e.target.value))}
          />
          <p className="text-sm text-gray-500 mt-1">
            Number of routes to process simultaneously
          </p>
        </div>

        <div>
          <Toggle
            checked={options.backgroundProcessing}
            onChange={(value) => handleToggle('backgroundProcessing', value)}
            label="Background Processing"
            description="Continue processing in the background"
          />
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Data Collection Features</h4>
          <div className="space-y-3">
            <Toggle
              checked={options[DATA_COLLECTION_OPTIONS.SHARP_TURNS]}
              onChange={(value) => handleToggle(DATA_COLLECTION_OPTIONS.SHARP_TURNS, value)}
              label="Sharp Turns Analysis"
              description="Identify and analyze sharp turns along the route"
            />
            
            <Toggle
              checked={options[DATA_COLLECTION_OPTIONS.BLIND_SPOTS]}
              onChange={(value) => handleToggle(DATA_COLLECTION_OPTIONS.BLIND_SPOTS, value)}
              label="Blind Spots Detection"
              description="Detect areas with limited visibility"
            />
            
            <Toggle
              checked={options[DATA_COLLECTION_OPTIONS.NETWORK_COVERAGE]}
              onChange={(value) => handleToggle(DATA_COLLECTION_OPTIONS.NETWORK_COVERAGE, value)}
              label="Network Coverage"
              description="Analyze cellular network coverage along the route"
            />
            
            <Toggle
              checked={options[DATA_COLLECTION_OPTIONS.ROAD_CONDITIONS]}
              onChange={(value) => handleToggle(DATA_COLLECTION_OPTIONS.ROAD_CONDITIONS, value)}
              label="Road Conditions"
              description="Assess road quality and surface conditions"
            />
            
            <Toggle
              checked={options[DATA_COLLECTION_OPTIONS.ACCIDENT_DATA]}
              onChange={(value) => handleToggle(DATA_COLLECTION_OPTIONS.ACCIDENT_DATA, value)}
              label="Accident Data"
              description="Identify accident-prone areas"
            />
            
            <Toggle
              checked={options[DATA_COLLECTION_OPTIONS.SEASONAL_WEATHER]}
              onChange={(value) => handleToggle(DATA_COLLECTION_OPTIONS.SEASONAL_WEATHER, value)}
              label="Seasonal Weather"
              description="Include seasonal weather patterns"
            />
            
            <Toggle
              checked={options[DATA_COLLECTION_OPTIONS.EMERGENCY_SERVICES]}
              onChange={(value) => handleToggle(DATA_COLLECTION_OPTIONS.EMERGENCY_SERVICES, value)}
              label="Emergency Services"
              description="Locate nearby emergency services"
            />
            
            <Toggle
              checked={options[DATA_COLLECTION_OPTIONS.TRAFFIC_DATA]}
              onChange={(value) => handleToggle(DATA_COLLECTION_OPTIONS.TRAFFIC_DATA, value)}
              label="Traffic Data"
              description="Analyze traffic patterns and congestion"
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ProcessingOptions