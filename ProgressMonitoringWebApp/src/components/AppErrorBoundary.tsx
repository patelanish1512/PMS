import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from 'react-bootstrap';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
        <div className="text-center bg-white border rounded-3 shadow-sm p-5 app-error-panel">
          <AlertCircle size={42} className="text-danger mb-3" />
          <h1 className="h4 fw-bold mb-2">Something went wrong</h1>
          <p className="text-muted mb-4">The workspace could not be rendered. Refresh the page to start a clean session.</p>
          <Button variant="primary" className="d-inline-flex align-items-center gap-2" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Refresh
          </Button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;

