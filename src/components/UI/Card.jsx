import React from 'react'
import clsx from 'clsx'

const Card = ({ children, className = '', padding = 'p-6', shadow = true, hover = false }) => {
  return (
    <div className={clsx(
      'bg-white rounded-lg border border-gray-200',
      shadow && 'shadow-sm',
      hover && 'hover:shadow-md transition-shadow duration-200',
      padding,
      className
    )}>
      {children}
    </div>
  )
}

export default Card