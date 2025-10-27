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
        <h2 className="text-2xl font-semibold mb-4">Rate Limiting</h2>
        <p className="mb-4">
          API requests are rate limited to prevent abuse. The rate limits vary by endpoint type:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Authentication endpoints: 10 requests per minute</li>
          <li>Standard API endpoints: 100 requests per minute</li>
          <li>Public endpoints: 200 requests per minute</li>
        </ul>
        <p className="mb-4">
          When a rate limit is exceeded, the API will return a 429 Too Many Requests response.
          The response will include a Retry-After header indicating when you can retry the request.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Users</h3>
          <div className="border rounded-md mb-4">
            <div className="bg-blue-100 p-3 border-b">
              <span className="bg-blue-500 text-white px-2 py-1 rounded mr-2">GET</span>
              <code>/api/v1/users</code>
            </div>
            <div className="p-3">
              <p className="mb-2">Get all users with pagination and optional filtering.</p>
              <h4 className="font-semibold mb-1">Query Parameters:</h4>
              <ul className="list-disc pl-6 mb-2">
                <li>limit: Maximum number of users to return (default: 50)</li>
                <li>offset: Number of users to skip (default: 0)</li>
                <li>role: Filter users by role (admin, user, employee)</li>
              </ul>
            </div>
          </div>
          
          <div className="border rounded-md mb-4">
            <div className="bg-green-100 p-3 border-b">
              <span className="bg-green-500 text-white px-2 py-1 rounded mr-2">POST</span>
              <code>/api/v1/users</code>
            </div>
            <div className="p-3">
              <p className="mb-2">Create a new user.</p>
              <h4 className="font-semibold mb-1">Request Body:</h4>
              <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
{`{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "user",  // Optional, default: "user"
  "phone": "1234567890"  // Optional
}`}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Projects</h3>
          <div className="border rounded-md mb-4">
            <div className="bg-blue-100 p-3 border-b">
              <span className="bg-blue-500 text-white px-2 py-1 rounded mr-2">GET</span>
              <code>/api/v1/projects</code>
            </div>
            <div className="p-3">
              <p className="mb-2">Get all projects with pagination and optional filtering.</p>
              <h4 className="font-semibold mb-1">Query Parameters:</h4>
              <ul className="list-disc pl-6 mb-2">
                <li>limit: Maximum number of projects to return (default: 50)</li>
                <li>offset: Number of projects to skip (default: 0)</li>
                <li>status: Filter projects by status</li>
                <li>managerId: Filter projects by manager ID</li>
              </ul>
            </div>
          </div>
          
          <div className="border rounded-md mb-4">
            <div className="bg-green-100 p-3 border-b">
              <span className="bg-green-500 text-white px-2 py-1 rounded mr-2">POST</span>
              <code>/api/v1/projects</code>
            </div>
            <div className="p-3">
              <p className="mb-2">Create a new project.</p>
              <h4 className="font-semibold mb-1">Request Body:</h4>
              <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
{`{
  "name": "Project Name",
  "description": "Project description",
  "startDate": "2023-06-01",
  "endDate": "2023-12-31",  // Optional
  "status": "planning",  // Optional, default: "planning"
  "managerId": "user-uuid"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">OpenAPI Specification</h2>
        <p className="mb-4">
          A complete OpenAPI specification is available at{' '}
          <a href="/api/docs" className="text-blue-600 hover:underline">/api/docs</a>.
          This specification can be imported into API tools like Postman or Swagger UI.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Versioning</h2>
        <p className="mb-4">
          The API uses URL-based versioning (e.g., /api/v1/users). This ensures backward compatibility
          as the API evolves. The current version is v1.
        </p>
      </div>
      
      <div className="border-t pt-6 mt-8 text-sm text-gray-600">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}