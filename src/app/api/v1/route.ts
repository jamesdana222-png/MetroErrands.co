import { NextRequest } from 'next/server';
import { createSuccessResponse } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// API version information endpoint
export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;
  
  return createSuccessResponse({
    api: {
      name: "Errandsite API",
      version: "v1",
      status: "stable",
      documentation: `${baseUrl}/api/openapi`,
      endpoints: [
        {
          path: "/api/v1/users",
          methods: ["GET", "POST"],
          description: "User management endpoints"
        },
        {
          path: "/api/v1/projects",
          methods: ["GET", "POST"],
          description: "Project management endpoints"
        },
        {
          path: "/api/v1/tasks",
          methods: ["GET", "POST"],
          description: "Task management endpoints"
        },
        {
          path: "/api/v1/auth/login",
          methods: ["POST"],
          description: "User authentication"
        },
        {
          path: "/api/v1/auth/register",
          methods: ["POST"],
          description: "User registration"
        },
        {
          path: "/api/v1/employees",
          methods: ["GET", "POST"],
          description: "Employee management endpoints"
        }
      ]
    }
  });
}