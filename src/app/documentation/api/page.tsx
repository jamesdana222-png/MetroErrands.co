import React from 'react';

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Errandsite API Documentation</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Overview</h2>
        <p className="mb-4">
          The Errandsite API provides programmatic access to users, projects, tasks, and errand requests.
          All API endpoints follow a consistent response format and include proper validation and rate limiting.
        </p>
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <h3 className="font-semibold mb-2">Base URL</h3>
          <code className="bg-gray-200 px-2 py-1 rounded">/api/v1</code>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
        <p className="mb-4">
          All API requests (except for authentication endpoints) require authentication.
          Authentication is handled via cookies set during the login process.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Response Format</h2>
        <p className="mb-4">All API responses follow a consistent format:</p>
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
{`// Success response
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  },
  "meta": {
    "version": "v1",
    "timestamp": "2023-06-01T12:34:56.789Z",
    "requestId": "req_1234567890"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details (optional)
    }
  },
  "meta": {
    "version": "v1",
    "timestamp": "2023-06-01T12:34:56.789Z",
    "requestId": "req_1234567890"
  }
}`}
        </pre>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
        <p className="mb-4">
          For detailed API specifications, please visit our <a href="/api/openapi" className="text-blue-600 hover:underline">OpenAPI documentation</a>.
        </p>
      </div>
    </div>
  );
}