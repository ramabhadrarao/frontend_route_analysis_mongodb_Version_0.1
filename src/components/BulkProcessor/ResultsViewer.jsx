import React from 'react'
import { Download, Eye, FileText, AlertTriangle } from 'lucide-react'
import Card from '../UI/Card'
import Button from '../UI/Button'
import Badge from '../UI/Badge'
import { formatDate, formatDistance, getRiskLevel } from '../../utils/helpers'

const ResultsViewer = ({ results, onDownload, onViewDetails }) => {
  const { summary, routes, errors } = results

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Processing Results</h3>
        <Button
          variant="outline"
          icon={Download}
          onClick={onDownload}
        >
          Download Results
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{summary.successful}</p>
          <p className="text-sm text-gray-500">Successful</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
          <p className="text-sm text-gray-500">Failed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{summary.totalDistance}</p>
          <p className="text-sm text-gray-500">Total Distance</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{summary.averageRiskScore}</p>
          <p className="text-sm text-gray-500">Avg Risk Score</p>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Processed Routes</h4>
        <div className="max-h-64 overflow-y-auto">
          {routes.map((route, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{route.routeName}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistance(route.totalDistance)} • {formatDate(route.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getRiskLevel(route.riskScore)}>
                  {getRiskLevel(route.riskScore)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  onClick={() => onViewDetails(route.routeId)}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-red-600 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Processing Errors
          </h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  )
}

export default ResultsViewer