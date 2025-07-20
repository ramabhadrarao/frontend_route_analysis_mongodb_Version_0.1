import React from 'react'
import Card from '../UI/Card'
import Toggle from '../UI/Toggle'
import Select from '../UI/Select'
import Badge from '../UI/Badge'
import { DATA_COLLECTION_OPTIONS } from '../../utils/constants'
import { 
  Activity, 
  Eye, 
  Wifi, 
  Construction, 
  AlertTriangle, 
  Cloud, 
  Car, 
  Phone,
  Info,
  Zap,
  Settings,
  Database,
  Server
} from 'lucide-react'

const ProcessingOptions = ({ options, onUpdateOptions }) => {
  const handleToggle = (key, value) => {
    onUpdateOptions({ ...options, [key]: value })
  }

  const processingModes = [
    { value: 'basic', label: 'Basic Processing' },
    { value: 'enhanced', label: 'Enhanced Processing' },
    { value: 'enhancedWithVisibility', label: 'Enhanced + Auto Visibility' }
  ]

  const concurrentOptions = [
    { value: 1, label: '1 Route (Safest)' },
    { value: 2, label: '2 Routes (Conservative)' },
    { value: 3, label: '3 Routes' },
    { value: 4, label: '4 Routes' },
    { value: 5, label: '5 Routes' },
    { value: 10, label: '10 Routes (Optimized for 5800)' }
  ]
  
  const batchSizeOptions = [
    { value: 10, label: '10 Routes per Batch' },
    { value: 25, label: '25 Routes per Batch (Optimized)' },
    { value: 50, label: '50 Routes per Batch' }
  ]

  const dataCollectionModes = [
    { value: 'basic', label: 'Basic', description: 'Essential data only' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Most safety data (recommended)' },
    { value: 'complete', label: 'Complete', description: 'All available data (slower)' }
  ]

  const visibilityModes = [
    { value: 'basic', label: 'Basic Analysis' },
    { value: 'comprehensive', label: 'Comprehensive (Recommended)' },
    { value: 'detailed', label: 'Detailed Analysis' }
  ]

  // Feature groups for better organization
  const featureGroups = [
    {
      title: 'Core Safety Analysis',
      icon: AlertTriangle,
      features: [
        {
          key: DATA_COLLECTION_OPTIONS.SHARP_TURNS,
          label: 'Sharp Turns Analysis',
          description: 'Identify and analyze sharp turns along the route',
          icon: Activity,
          recommended: true
        },
        {
          key: DATA_COLLECTION_OPTIONS.BLIND_SPOTS,
          label: 'Blind Spots Detection', 
          description: 'Detect areas with limited visibility',
          icon: Eye,
          recommended: true
        },
        {
          key: DATA_COLLECTION_OPTIONS.ACCIDENT_DATA,
          label: 'Accident Data',
          description: 'Identify accident-prone areas using real APIs',
          icon: AlertTriangle,
          apiEnhanced: true
        }
      ]
    },
    {
      title: 'Infrastructure & Connectivity',
      icon: Wifi,
      features: [
        {
          key: DATA_COLLECTION_OPTIONS.NETWORK_COVERAGE,
          label: 'Network Coverage',
          description: 'Analyze cellular network coverage along the route',
          icon: Wifi
        },
        {
          key: DATA_COLLECTION_OPTIONS.ROAD_CONDITIONS,
          label: 'Enhanced Road Conditions',
          description: 'Assess road quality and surface conditions with multi-API integration',
          icon: Construction,
          apiEnhanced: true
        },
        {
          key: DATA_COLLECTION_OPTIONS.EMERGENCY_SERVICES,
          label: 'Emergency Services',
          description: 'Locate nearby emergency services',
          icon: Phone,
          recommended: true
        }
      ]
    },
    {
      title: 'Environmental Factors',
      icon: Cloud,
      features: [
        {
          key: DATA_COLLECTION_OPTIONS.SEASONAL_WEATHER,
          label: 'Seasonal Weather Analysis',
          description: 'Advanced seasonal weather patterns and predictions',
          icon: Cloud,
          advanced: true
        },
        {
          key: DATA_COLLECTION_OPTIONS.TRAFFIC_DATA,
          label: 'Traffic Data',
          description: 'Analyze traffic patterns and congestion',
          icon: Car
        }
      ]
    }
  ]

  // Check if large batch mode (more than 1000 routes estimated)
  const isLargeBatchMode = options.concurrentRoutes >= 10

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Settings className="w-5 h-5 mr-2" />
        Enhanced Processing Options
      </h3>
      
      <div className="space-y-6">
        {/* Large Batch Mode Indicator */}
        {isLargeBatchMode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Server className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-900">Large Batch Mode Active</span>
              <Badge variant="warning" size="sm">OPTIMIZED</Badge>
            </div>
            <p className="text-sm text-orange-800">
              Configuration optimized for processing 5000+ routes with maximum efficiency.
            </p>
          </div>
        )}

        {/* Processing Mode Selection (if not handled in parent) */}
        {!options.mode && (
          <div>
            <Select
              label="Processing Mode"
              options={processingModes}
              value={options.mode || 'enhanced'}
              onChange={(e) => handleToggle('mode', e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enhanced mode provides comprehensive data collection and analysis
            </p>
          </div>
        )}

        {/* Data Collection Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Collection Intensity
          </label>
          <Select
            options={dataCollectionModes}
            value={options.dataCollectionMode || 'comprehensive'}
            onChange={(e) => handleToggle('dataCollectionMode', e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">
            Controls how much data is collected per route
          </p>
        </div>

        {/* Concurrent Routes */}
        <div>
          <Select
            label="Concurrent Routes"
            options={concurrentOptions}
            value={options.concurrentRoutes}
            onChange={(e) => handleToggle('concurrentRoutes', parseInt(e.target.value))}
          />
          <p className="text-sm text-gray-500 mt-1">
            {options.enableAutomaticVisibilityAnalysis 
              ? 'Higher concurrency optimized for large batches with automatic retry'
              : 'Number of routes to process simultaneously'
            }
          </p>
        </div>

        {/* Batch Size */}
        <div>
          <Select
            label="Batch Size"
            options={batchSizeOptions}
            value={options.batchSize || 25}
            onChange={(e) => handleToggle('batchSize', parseInt(e.target.value))}
          />
          <p className="text-sm text-gray-500 mt-1">
            Number of routes processed per batch - 25 is optimal for memory management
          </p>
        </div>

        {/* Visibility Analysis Mode */}
        {options.enableAutomaticVisibilityAnalysis && (
          <div>
            <Select
              label="Visibility Analysis Mode"
              options={visibilityModes}
              value={options.visibilityAnalysisMode || 'comprehensive'}
              onChange={(e) => handleToggle('visibilityAnalysisMode', e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive mode recommended for best accuracy
            </p>
          </div>
        )}

        {/* Background Processing */}
        <div>
          <Toggle
            checked={options.backgroundProcessing}
            onChange={(value) => handleToggle('backgroundProcessing', value)}
            label="Background Processing"
            description="Continue processing in the background for large batches (required for 5000+ routes)"
          />
        </div>

        {/* Visibility Analysis Status (if enabled) */}
        {options.enableAutomaticVisibilityAnalysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Automatic Visibility Analysis Enabled</span>
              <Badge variant="primary" size="sm">AUTO</Badge>
            </div>
            <p className="text-sm text-blue-700">
              Sharp turns and blind spots will be automatically detected for each route using advanced algorithms.
              Timeout: {options.visibilityAnalysisTimeout ? `${options.visibilityAnalysisTimeout / 1000}s` : '120s'} per route
            </p>
          </div>
        )}

        {/* Feature Groups */}
        {featureGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <group.icon className="w-4 h-4 mr-2 text-gray-600" />
              {group.title}
            </h4>
            <div className="space-y-3 pl-6 border-l-2 border-gray-100">
              {group.features.map((feature) => {
                const FeatureIcon = feature.icon
                const isEnabled = options[feature.key]
                
                return (
                  <div key={feature.key} className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <FeatureIcon className={`w-4 h-4 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <Toggle
                          checked={isEnabled}
                          onChange={(value) => handleToggle(feature.key, value)}
                          label={
                            <div className="flex items-center space-x-2">
                              <span>{feature.label}</span>
                              {feature.recommended && (
                                <Badge variant="success" size="sm">Recommended</Badge>
                              )}
                              {feature.apiEnhanced && (
                                <Badge variant="primary" size="sm">Enhanced API</Badge>
                              )}
                              {feature.advanced && (
                                <Badge variant="warning" size="sm">Advanced</Badge>
                              )}
                            </div>
                          }
                          description={feature.description}
                        />
                      </div>
                    </div>
                    
                    {/* Special visibility analysis note */}
                    {(feature.key === DATA_COLLECTION_OPTIONS.SHARP_TURNS || 
                      feature.key === DATA_COLLECTION_OPTIONS.BLIND_SPOTS) && 
                     options.enableAutomaticVisibilityAnalysis && (
                      <div className="ml-7 bg-blue-50 border border-blue-200 rounded-md p-2">
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-blue-600" />
                          <span className="text-xs text-blue-700 font-medium">
                            Enhanced with Automatic Analysis
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          This feature will use automatic visibility analysis for more accurate detection
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Advanced Options */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-gray-600" />
            Advanced Options
          </h4>
          <div className="space-y-3">
            <Toggle
              checked={options.skipExistingRoutes !== false}
              onChange={(value) => handleToggle('skipExistingRoutes', value)}
              label="Skip Existing Routes"
              description="Skip routes that have already been processed to save time"
            />
            
            <Toggle
              checked={options.continueOnVisibilityFailure !== false}
              onChange={(value) => handleToggle('continueOnVisibilityFailure', value)}
              label="Continue on Visibility Failure"
              description="Continue processing even if visibility analysis fails for some routes"
            />
            
            <Toggle
              checked={options.downloadImages || false}
              onChange={(value) => handleToggle('downloadImages', value)}
              label="Download Street View Images"
              description="Download Google Street View images for critical points (slower processing)"
            />
            
            <Toggle
              checked={options.generateReports || false}
              onChange={(value) => handleToggle('generateReports', value)}
              label="Generate PDF Reports"
              description="Automatically generate detailed PDF reports for each route"
            />
          </div>
        </div>

        {/* Processing Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Processing Summary</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Mode:</span>
              <span className="ml-2 font-medium">
                {options.mode === 'enhancedWithVisibility' ? 'Enhanced + Visibility' : 
                 options.mode === 'enhanced' ? 'Enhanced' : 'Basic'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Data Collection:</span>
              <span className="ml-2 font-medium capitalize">
                {options.dataCollectionMode || 'Comprehensive'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Concurrent Routes:</span>
              <span className="ml-2 font-medium">{options.concurrentRoutes}</span>
            </div>
            <div>
              <span className="text-gray-600">Batch Size:</span>
              <span className="ml-2 font-medium">{options.batchSize || 25}</span>
            </div>
            <div>
              <span className="text-gray-600">Features Enabled:</span>
              <span className="ml-2 font-medium">
                {Object.values(DATA_COLLECTION_OPTIONS).filter(key => options[key]).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Background:</span>
              <span className="ml-2 font-medium">
                {options.backgroundProcessing ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          {options.enableAutomaticVisibilityAnalysis && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Automatic Visibility Analysis Active
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Mode: {options.visibilityAnalysisMode || 'comprehensive'} | 
                Timeout: {Math.round((options.visibilityAnalysisTimeout || 120000) / 60000)}min per route |
                Continue on failure: {options.continueOnVisibilityFailure !== false ? 'Yes' : 'No'}
              </p>
            </div>
          )}

          {isLargeBatchMode && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  Large Batch Optimizations Active
                </span>
              </div>
              <p className="text-xs text-purple-700 mt-1">
                Checkpoint saves: Every 100 routes | 
                Memory management: Active | 
                Retry logic: 3 attempts per route
              </p>
            </div>
          )}
        </div>

        {/* Help Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Processing Tips for Large Batches:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>For 5000+ routes: Use 10 concurrent routes with 25 batch size</li>
                <li>Enable all data collection features for comprehensive analysis</li>
                <li>Background processing is required for batches over 1000 routes</li>
                <li>Processing will continue even if you close the browser</li>
                <li>Checkpoints are saved automatically for resume capability</li>
                <li>Expect 48-72 hours for 5800 routes with all features enabled</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ProcessingOptions