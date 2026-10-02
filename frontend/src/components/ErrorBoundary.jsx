import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card p-8 rounded-2xl">
            <h1 className="text-2xl font-black">Something went wrong.</h1>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
