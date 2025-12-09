import React from "react";

class ErrorBoundary extends React.Component {
         constructor(props) {
                  super(props);
                  this.state = { hasError: false };
         }

         static getDerivedStateFromError() {
                  return { hasError: true };
         }

         componentDidCatch(error, info) {
                  // In a real app you could send this to a logging service
                  console.error("ErrorBoundary caught an error", error, info);
         }

         render() {
                  if (this.state.hasError) {
                           return (
                                    <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                                             <h2>Something went wrong.</h2>
                                             <p>Please refresh the page or try again later.</p>
                                    </div>
                           );
                  }

                  return this.props.children;
         }
}

export default ErrorBoundary;
