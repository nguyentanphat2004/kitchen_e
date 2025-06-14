import React from 'react';
import { Spin, Typography } from 'antd';

interface LoadingStateProps {
  size?: 'small' | 'default' | 'large';
  message?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'large',
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Spin size={size} />
      {message && (
        <Typography.Text className="mt-2 text-gray-500">
          {message}
        </Typography.Text>
      )}
    </div>
  );
};

export default LoadingState;