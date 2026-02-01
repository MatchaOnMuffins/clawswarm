import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

export interface AuthenticatedRequest extends Request {
  agent?: {
    id: string;
    name: string;
    apiKey: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid Authorization header',
      hint: 'Use: Authorization: Bearer YOUR_API_KEY',
    });
  }

  const apiKey = authHeader.slice(7); // Remove 'Bearer '

  try {
    const agent = await prisma.agent.findUnique({
      where: { apiKey },
    });

    if (!agent) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    // Update last active timestamp
    await prisma.agent.update({
      where: { id: agent.id },
      data: { lastActiveAt: new Date() },
    });

    req.agent = {
      id: agent.id,
      name: agent.name,
      apiKey: agent.apiKey,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}
