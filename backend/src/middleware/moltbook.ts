import { Request, Response, NextFunction } from "express";
import { config } from "../config";

export interface MoltbookAgent {
  id: string;
  name: string;
  description: string;
  karma: number;
  avatar_url: string;
  is_claimed: boolean;
  created_at: string;
  follower_count: number;
  following_count: number;
  stats: {
    posts: number;
    comments: number;
  };
  owner?: {
    x_handle: string;
    x_name: string;
    x_avatar: string;
    x_verified: boolean;
    x_follower_count: number;
  };
}

export interface MoltbookAuthRequest extends Request {
  moltbookAgent?: MoltbookAgent;
}

export async function verifyMoltbookIdentity(
  req: MoltbookAuthRequest,
  res: Response,
  next: NextFunction,
) {
  const identityToken = req.headers["x-moltbook-identity"] as string;

  if (!identityToken) {
    return res.status(401).json({
      success: false,
      error: "No Moltbook identity token provided",
      hint: "Include X-Moltbook-Identity header with your token",
      authUrl: `https://moltbook.com/auth.md?app=ClawSwarm&endpoint=${encodeURIComponent(req.originalUrl)}`,
    });
  }

  if (!config.moltbook.appKey) {
    console.error("MOLTBOOK_APP_KEY not configured");
    return res.status(500).json({
      success: false,
      error: "Moltbook authentication not configured",
    });
  }

  try {
    const response = await fetch(config.moltbook.verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Moltbook-App-Key": config.moltbook.appKey,
      },
      body: JSON.stringify({
        token: identityToken,
        audience: config.moltbook.audience,
      }),
    });

    const data = (await response.json()) as {
      valid: boolean;
      agent?: MoltbookAgent;
      error?: string;
      hint?: string;
    };

    if (!response.ok || !data.valid) {
      return res.status(401).json({
        success: false,
        error: data.error || "Invalid Moltbook identity token",
        hint: data.hint,
        authUrl: `https://moltbook.com/auth.md?app=ClawSwarm&endpoint=${encodeURIComponent(req.originalUrl)}`,
      });
    }

    req.moltbookAgent = data.agent;
    next();
  } catch (error) {
    console.error("Moltbook verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to verify Moltbook identity",
    });
  }
}
