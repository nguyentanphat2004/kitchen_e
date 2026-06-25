import React from 'react';
import { Alert, Button } from 'antd';

class CategoryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CategoryManagement Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Error Loading Categories"
          description="There was an error loading the category management interface. Please refresh the page."
          type="error"
          showIcon
          action={
            <Button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

export default CategoryErrorBoundary;
