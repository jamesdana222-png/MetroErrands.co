import { NextResponse } from 'next/server';
import { API_VERSION } from '@/lib/api-utils';

// OpenAPI specification for the API
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Errandsite API',
    description: 'API for managing errands, users, and projects',
    version: API_VERSION,
    contact: {
      name: 'Errandsite Support',
      email: 'support@errandsite.com'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current API version'
    }
  ],
  tags: [
    {
      name: 'users',
      description: 'User management operations'
    },
    {
      name: 'auth',
      description: 'Authentication operations'
    },
    {
      name: 'projects',
      description: 'Project management operations'
    },
    {
      name: 'tasks',
      description: 'Task management operations'
    },
    {
      name: 'employees',
      description: 'Employee management operations'
    }
  ],
  paths: {
    '/users': {
      get: {
        tags: ['users'],
        summary: 'Get all users',
        description: 'Returns a list of users with pagination',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of users to return',
            schema: {
              type: 'integer',
              default: 50
            }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of users to skip',
            schema: {
              type: 'integer',
              default: 0
            }
          },
          {
            name: 'role',
            in: 'query',
            description: 'Filter users by role',
            schema: {
              type: 'string',
              enum: ['admin', 'user', 'employee']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    data: {
                      type: 'object',
                      properties: {
                        users: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/User'
                          }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: {
                              type: 'integer'
                            },
                            limit: {
                              type: 'integer'
                            },
                            offset: {
                              type: 'integer'
                            }
                          }
                        }
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/Meta'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['users'],
        summary: 'Create a new user',
        description: 'Creates a new user with the provided information',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserInput'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          $ref: '#/components/schemas/User'
                        }
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/Meta'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '422': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError'
                }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      get: {
        tags: ['users'],
        summary: 'Get user by ID',
        description: 'Returns a single user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID of the user to return',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          $ref: '#/components/schemas/User'
                        }
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/Meta'
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'User login',
        description: 'Authenticates a user and returns a session token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  password: {
                    type: 'string',
                    format: 'password'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          $ref: '#/components/schemas/User'
                        },
                        session: {
                          type: 'object',
                          properties: {
                            token: {
                              type: 'string'
                            },
                            expires_at: {
                              type: 'string',
                              format: 'date-time'
                            }
                          }
                        }
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/Meta'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '422': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError'
                }
              }
            }
          },
          '429': {
            description: 'Too many requests',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          name: {
            type: 'string'
          },
          role: {
            type: 'string',
            enum: ['admin', 'user', 'employee']
          },
          phone: {
            type: 'string',
            nullable: true
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      UserInput: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8
          },
          name: {
            type: 'string',
            minLength: 2
          },
          role: {
            type: 'string',
            enum: ['admin', 'user', 'employee']
          },
          phone: {
            type: 'string'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string'
              },
              message: {
                type: 'string'
              },
              details: {
                type: 'object'
              }
            }
          },
          meta: {
            $ref: '#/components/schemas/Meta'
          }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR'
              },
              message: {
                type: 'string',
                example: 'Validation failed'
              },
              details: {
                type: 'object',
                additionalProperties: {
                  type: 'string'
                }
              }
            }
          },
          meta: {
            $ref: '#/components/schemas/Meta'
          }
        }
      },
      Meta: {
        type: 'object',
        properties: {
          version: {
            type: 'string'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          requestId: {
            type: 'string'
          }
        }
      }
    },
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sb-access-token'
      }
    }
  },
  security: [
    {
      cookieAuth: []
    }
  ]
};

// API documentation endpoint
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}