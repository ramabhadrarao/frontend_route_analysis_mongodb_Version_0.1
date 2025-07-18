import React from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import Card from '../UI/Card'
import ProgressBar from '../UI/ProgressBar'
import Badge from '../UI/Badge'
import { PROCESSING_STATUS } from '../../utils/constants'

const ProcessingProgress = ({ progress, onStop }) => {
  const { status, currentRoute, totalRoutes, completedRoutes, failedRoutes, estimatedTimeRemaining } = progress

  const getStatusIcon = (status) => {
    switch (status) {
      case PROCESSING_STATUS.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case PROCESSING_STATUS.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />
      case PROCESSING_STATUS.PROCESSING:
        return <Clock className="w-5 h-5 text-blue-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case PROCESSING_STATUS.COMPLETED:
        return <Badge variant="success">Completed</Badge>
      case PROCESSING_STATUS.FAILED:
        return <Badge variant="danger">Failed</Badge>
      case PROCESSING_STATUS.PROCESSING:
        return <Badge variant="primary">Processing</Badge>
      default:
        return <Badge variant="warning">Pending</Badge>
    }
  }

  const progressPercentage = totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Processing Progress</h3>
        {getStatusBadge(status)}
      </div>

      <div className="space-y-4">
        <ProgressBar
          value={progressPercentage}
          max={100}
          showLabel={true}
          variant={status === PROCESSING_STATUS.FAILED ? 'danger' : 'primary'}
        />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{completedRoutes}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalRoutes}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{failedRoutes}</p>
            <p className="text-sm text-gray-500">Failed</p>
          </div>
        </div>

        {currentRoute && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(status)}
              <span className="font-medium text-gray-900">Currently Processing</span>
            </div>
            <p className="text-sm text-gray-700">{currentRoute}</p>
          </div>
        )}

        {estimatedTimeRemaining && (
          <div className="text-center text-sm text-gray-500">
            Estimated time remaining: {estimatedTimeRemaining}
          </div>
        )}

        {status === PROCESSING_STATUS.PROCESSING && (
          <div className="text-center">
            <button
              onClick={onStop}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Stop Processing
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default ProcessingProgress