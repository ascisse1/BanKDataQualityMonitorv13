import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  isLoading?: boolean;
}

const Card = ({
  children,
  className = '',
  title,
  description,
  footer,
  isLoading = false,
}: CardProps) => {
  return (
    <div
      className={`bg-white rounded-card shadow-card overflow-hidden transition-shadow duration-200 hover:shadow-card-hover ${className}`}
    >
      {isLoading ? (
        <div className="p-6 animate-pulse">
          {title && <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />}
          {description && <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      ) : (
        <>
          {(title || description) && (
            <div className="px-6 pt-6 pb-3">
              {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
          )}
          <div className={`${title || description ? 'px-6 pb-6' : 'p-6'}`}>{children}</div>
          {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">{footer}</div>}
        </>
      )}
    </div>
  );
};

export default Card;