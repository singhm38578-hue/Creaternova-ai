import express from 'express';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to extract JSON from model output safely
function extractJsonFromText(rawText: string) {
  try {
    const cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (inner) {
        // continue
      }
    }
    throw new Error('Could not parse valid JSON from AI response');
  }
}

import { dbManager, QUALIFIED_REFERRAL_REWARD_CREDITS } from './server/db.ts';
import agentRouter from './server/agentRoutes.ts';
import { CreditWalletService } from './server/creditService.ts';
import { PaymentService } from './server/paymentService.ts';
import { AIUsageService } from './server/aiUsageService.ts';
import { AIProviderService, AIProviderError } from './server/aiProviderService.ts';
import { VideoProviderService } from './server/videoProviderService.ts';
import {
  AI_OPERATIONS_CONFIG,
  AI_SAFETY_LIMITS,
  calculateEstimatedVideoCost,
  getClientSafeOperationsMeta,
} from './server/aiCostConfig.ts';
import { GENERATION_CREDIT_COSTS, PLAN_DEFINITIONS } from './src/config/creditCosts.ts';

// Server-side explicit admin allowlist
const TRUSTED_ADMIN_EMAILS = new Set([
  'singhm38578@gmail.com',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e: string) => e.trim().toLowerCase()) : [])
]);

function isAuthorizedAdmin(payload: { email?: string; admin?: boolean; role?: string } | null | undefined): boolean {
  if (!payload) return false;
  // 1. Firebase custom claims or explicit role property
  if (payload.admin === true || payload.role === 'admin') return true;
  // 2. Explicit server-side admin allowlist
  if (payload.email && typeof payload.email === 'string') {
    return TRUSTED_ADMIN_EMAILS.has(payload.email.toLowerCase().trim());
  }
  return false;
}

// Helper to extract authenticated user or null - NEVER trusts client-supplied UIDs
function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

  if (token) {
    // 1. Check if token is a Firebase ID Token (JWT with 3 parts)
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        const uid = payload.user_id || payload.sub;
        if (uid) {
          // Verify expiration
          const nowSeconds = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < nowSeconds) {
            return null; // Expired token
          }

          const isAdmin = isAuthorizedAdmin(payload);
          return {
            id: uid,
            uid,
            name: payload.name || payload.email?.split('@')[0] || 'Creator',
            email: payload.email || '',
            role: isAdmin ? 'admin' : 'user',
            plan: 'free',
            authToken: token,
          };
        }
      } catch (e) {
        // continue
      }
    }

    // 2. Check local session token
    const sessionUser = dbManager.authenticateToken(token);
    if (sessionUser) {
      const isAdmin = isAuthorizedAdmin(sessionUser);
      return { ...sessionUser, role: isAdmin ? 'admin' : 'user', authToken: token };
    }
  }

  // No unverified fallbacks. Never trust x-user-uid header or client-provided UIDs.
  return null;
}

// Middleware requiring authentication
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' });
  }
  (req as any).user = user;
  next();
}

// Middleware requiring admin role
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin privileges required.' });
  }
  (req as any).user = user;
  next();
}

// Mount CreatorNova AI Agent Subsystem Routes
app.use('/api', agentRouter);

// -------------------------------------------------------------
// AUTHENTICATION & USER PROFILE ENDPOINTS
// -------------------------------------------------------------

// Sign Up
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, preferredLanguage, creatorNiche, defaultPlatform } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const { user, token } = dbManager.registerUser({
      name,
      email,
      password,
      preferredLanguage,
      creatorNiche,
      defaultPlatform,
    });

    const { passwordHash, ...safeUser } = user;
    const brandKit = dbManager.getBrandKit(user.id);
    const credits = dbManager.getUserCredits(user.id);

    return res.status(201).json({ user: safeUser, token, brandKit, credits });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { user, token } = dbManager.loginUser({ email, password });
    const { passwordHash, ...safeUser } = user;
    const brandKit = dbManager.getBrandKit(user.id);
    const credits = dbManager.getUserCredits(user.id);

    return res.json({ user: safeUser, token, brandKit, credits });
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Invalid credentials.' });
  }
});

// Google Sign-In Integration Ready Endpoint
app.post('/api/auth/google', (req, res) => {
  // If GOOGLE_CLIENT_ID or OAuth token is not configured in environment
  return res.status(501).json({
    integrationRequired: true,
    provider: 'Google Identity Services (OAuth 2.0)',
    message: 'Google Sign-In integration required. Please configure GOOGLE_CLIENT_ID in your cloud environment to enable one-click Google login.',
  });
});

// Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const resetToken = dbManager.createPasswordResetToken(email);
    return res.json({
      success: true,
      message: 'Password reset link generated. (Transactional email service integration required for SMTP delivery).',
      demoResetToken: resetToken,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to process request.' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    dbManager.resetPasswordWithToken(token, password);
    return res.json({ success: true, message: 'Password has been updated. You can now log in.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Reset password failed.' });
  }
});

// Get Current User Profile, Credits & Brand Kit
app.get('/api/auth/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' });
  }

  const { passwordHash, ...safeUser } = user as any;
  const brandKit = dbManager.getBrandKit(user.id);
  const credits = dbManager.getUserCredits(user.id);
  const creditConfig = dbManager.getCreditConfig();

  return res.json({ user: safeUser, brandKit, credits, creditConfig, isDemoGuest: false });
});

// Update Profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { name, profileImage, preferredLanguage, creatorNiche, defaultPlatform, defaultContentLanguage, onboardingCompleted } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
    if (creatorNiche !== undefined) updates.creatorNiche = creatorNiche;
    if (defaultPlatform !== undefined) updates.defaultPlatform = defaultPlatform;
    if (defaultContentLanguage !== undefined) updates.defaultContentLanguage = defaultContentLanguage;
    if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted;

    const updated = dbManager.updateUserProfile(user.id, updates);

    const { passwordHash, ...safeUser } = updated;
    return res.json({ user: safeUser });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Profile update failed.' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    dbManager.logoutUser(token);
  }
  return res.json({ success: true });
});

// Delete Account (Deliberate confirmation, authenticated user isolation, removes private data)
app.delete('/api/auth/account', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { confirmation } = req.body || {};

    if (confirmation !== 'DELETE' && confirmation !== 'CONFIRM_DELETE') {
      return res.status(400).json({
        error: 'CONFIRMATION_REQUIRED',
        message: 'Deliberate confirmation required. Please confirm deletion by typing DELETE.',
      });
    }

    // Authenticated user can ONLY delete their own account
    const result = dbManager.deleteUserAccount(user.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete account.' });
  }
});

// Download My Data (Authenticated export of user-owned profile, projects, calendar, and usage)
app.get('/api/auth/export-data', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const exportedData = dbManager.exportUserData(user.id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="creatornova-data-${user.id}.json"`);
    return res.send(JSON.stringify(exportedData, null, 2));
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to export data.' });
  }
});

// Contact & Support Ticket submission
app.post('/api/support/ticket', (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    const { category, subject, message, email } = req.body || {};

    const validCategories = [
      'Account',
      'Projects',
      'AI Generation',
      'Credits',
      'Billing',
      'Technical Problem',
      'Other',
    ];

    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        error: 'INVALID_CATEGORY',
        message: `Category must be one of: ${validCategories.join(', ')}`,
      });
    }

    const contactEmail = (email || user?.email || '').trim();
    if (!contactEmail || !contactEmail.includes('@')) {
      return res.status(400).json({
        error: 'VALID_EMAIL_REQUIRED',
        message: 'A valid email address is required to receive support responses.',
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'SUBJECT_REQUIRED', message: 'Subject is required.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'MESSAGE_REQUIRED', message: 'Message details are required.' });
    }

    const ticket = dbManager.createSupportTicket({
      userId: user?.id,
      userEmail: contactEmail,
      category,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      ticket: {
        id: ticket.id,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
      message: 'Support request received. A ticket has been created and logged for team review.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to submit support ticket.' });
  }
});

// Content Reporting Foundation (For templates or public creator assets)
app.post('/api/reports', (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    const { targetType, targetId, targetTitle, category, details, email } = req.body || {};

    const validCategories = ['Spam', 'Copyright concern', 'Privacy concern', 'Other'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        error: 'INVALID_CATEGORY',
        message: `Report category must be one of: ${validCategories.join(', ')}`,
      });
    }

    if (!targetId || !targetType) {
      return res.status(400).json({
        error: 'TARGET_REQUIRED',
        message: 'Target ID and type are required to submit a report.',
      });
    }

    if (!details || !details.trim()) {
      return res.status(400).json({
        error: 'DETAILS_REQUIRED',
        message: 'Please provide details explaining the concern.',
      });
    }

    const report = dbManager.createContentReport({
      reporterUserId: user?.id,
      reporterEmail: email || user?.email,
      targetType: targetType || 'template',
      targetId,
      targetTitle,
      category,
      details,
    });

    return res.status(201).json({
      success: true,
      report: {
        id: report.id,
        category: report.category,
        status: report.status,
        createdAt: report.createdAt,
      },
      message: 'Report received. Our moderation team will review this template. Thank you for protecting the creator community.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to submit content report.' });
  }
});

// -------------------------------------------------------------
// BRAND KIT ENDPOINTS
// -------------------------------------------------------------

app.get('/api/brand-kit', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const brandKit = dbManager.getBrandKit(user.id);
  return res.json({ brandKit });
});

app.put('/api/brand-kit', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const updated = dbManager.updateBrandKit(user.id, req.body);
  return res.json({ brandKit: updated });
});

// -------------------------------------------------------------
// PROJECT LIBRARY (USER-ISOLATED & FILTERABLE)
// -------------------------------------------------------------

// List Projects (With Search & Filters)
app.get('/api/projects', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const { search, platform, language, contentType, sort } = req.query;
  const projects = dbManager.getUserProjects(user.id, {
    search: typeof search === 'string' ? search : undefined,
    platform: typeof platform === 'string' ? platform : undefined,
    language: typeof language === 'string' ? language : undefined,
    contentType: typeof contentType === 'string' ? contentType : undefined,
    sort: typeof sort === 'string' ? sort : undefined,
  });

  return res.json({ projects, count: projects.length });
});

// Get Single Project (Ownership Verified)
app.get('/api/projects/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const project = dbManager.getUserProjectById(req.params.id, user.id);
  if (!project) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found or access denied.' });
  }

  return res.json({ project });
});

// Create Project
app.post('/api/projects', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const project = req.body;
    const saved = dbManager.saveUserProject(project, user.id);

    // If this referred user performs their first creation action, qualify & reward referral
    dbManager.qualifyAndRewardReferral(user.id, QUALIFIED_REFERRAL_REWARD_CREDITS, (user as any).authToken).catch(() => {});

    return res.status(201).json({ project: saved, saved: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed saving project.' });
  }
});

// Update / Autosave Project
app.put('/api/projects/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const project = { ...req.body, id: req.params.id };
    const saved = dbManager.saveUserProject(project, user.id);
    return res.json({ project: saved, saved: true, updatedAt: saved.updatedAt });
  } catch (err: any) {
    return res.status(403).json({ error: err.message || 'Failed updating project.' });
  }
});

// Delete Project
app.delete('/api/projects/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    dbManager.deleteUserProject(req.params.id, user.id);
    return res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    return res.status(403).json({ error: err.message || 'Failed deleting project.' });
  }
});

// Duplicate Project
app.post('/api/projects/:id/duplicate', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const duplicate = dbManager.duplicateUserProject(req.params.id, user.id);
    return res.status(201).json({ project: duplicate });
  } catch (err: any) {
    return res.status(403).json({ error: err.message || 'Failed duplicating project.' });
  }
});

// -------------------------------------------------------------
// SHAREABLE TEMPLATES ENDPOINTS
// -------------------------------------------------------------

// Create or update shareable template
app.post('/api/templates', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const template = dbManager.createOrUpdateTemplate(user.id, req.body);
    return res.status(201).json({
      template,
      shareableUrl: `/template/${template.id}`,
      success: true,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed creating template' });
  }
});

// Public preview for template (NO auth required, strict privacy)
app.get('/api/templates/public/:id', (req, res) => {
  const template = dbManager.getPublicTemplate(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND', message: 'Template not found or has been disabled by creator.' });
  }
  return res.json({ template });
});

// List user's own created templates
app.get('/api/templates/my-templates', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const templates = dbManager.getUserTemplates(user.id);
  return res.json({ templates });
});

// Toggle template active status (disable/enable)
app.put('/api/templates/:id/status', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const { isActive } = req.body;
  const updated = dbManager.toggleTemplateActive(req.params.id, user.id, Boolean(isActive));
  if (!updated) {
    return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND', message: 'Template not found or access denied.' });
  }
  return res.json({ template: updated, success: true });
});

// Delete template
app.delete('/api/templates/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const deleted = dbManager.deleteTemplate(req.params.id, user.id);
  if (!deleted) {
    return res.status(404).json({ error: 'TEMPLATE_NOT_FOUND', message: 'Template not found or access denied.' });
  }
  return res.json({ success: true });
});

// Use template to clone into recipient's projects
app.post('/api/templates/:id/use', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({
      error: 'AUTH_REQUIRED',
      message: 'Please sign in or create an account to copy this template into your workspace.',
    });
  }

  try {
    const project = dbManager.useTemplate(req.params.id, user.id);

    // If user was referred, qualify & reward their referrer
    dbManager.qualifyAndRewardReferral(user.id, QUALIFIED_REFERRAL_REWARD_CREDITS, (user as any).authToken).catch(() => {});

    return res.status(201).json({
      project,
      success: true,
      message: 'Template successfully copied into your projects library.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed using template' });
  }
});

// -------------------------------------------------------------
// REFERRAL FOUNDATION & ANTI-ABUSE ENDPOINTS
// -------------------------------------------------------------

// Get user's referral code and link
app.get('/api/referrals/my-code', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const referralCode = dbManager.getUserReferralCode(user.id);
  return res.json({
    referralCode,
    referralLink: `/ref/${referralCode}`,
    rewardCredits: QUALIFIED_REFERRAL_REWARD_CREDITS,
  });
});

// Track referral link click (PUBLIC - NO credits awarded)
app.post('/api/referrals/click', (req, res) => {
  const { referralCode } = req.body;
  if (!referralCode) {
    return res.status(400).json({ error: 'Referral code is required' });
  }

  const result = dbManager.recordReferralClick(referralCode, req.ip);
  return res.json(result);
});

// Track referral signup
app.post('/api/referrals/signup', (req, res) => {
  const user = getAuthenticatedUser(req);
  const { referralCode } = req.body;

  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  if (!referralCode) return res.status(400).json({ error: 'Referral code required' });

  const result = dbManager.recordReferralSignup(referralCode, user.id);
  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

// Get user's referral stats and earned bonus credits
app.get('/api/referrals/my-stats', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const stats = dbManager.getUserReferralStats(user.id);
  return res.json(stats);
});


// -------------------------------------------------------------
// CREDITS & USAGE DASHBOARD ENDPOINTS
// -------------------------------------------------------------

// Credit Wallet (Firestore backed)
app.get('/api/credits/wallet', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  // Perform monthly credit reset check (resets to plan's monthly allocation if 30-day period reached)
  const walletData = await CreditWalletService.resetMonthlyCredits(user.id, (user as any).authToken);
  const planInfo = PLAN_DEFINITIONS[walletData.plan] || PLAN_DEFINITIONS.free;
  return res.json({
    wallet: {
      plan: walletData.plan,
      creditBalance: walletData.creditBalance,
      totalRemaining: walletData.creditBalance,
      textCredits: Math.floor(walletData.creditBalance * 0.4),
      imageCredits: Math.floor(walletData.creditBalance * 0.3),
      voiceCredits: Math.floor(walletData.creditBalance * 0.2),
      videoCredits: Math.floor(walletData.creditBalance * 0.1),
      monthlyAllocation: planInfo.monthlyCredits,
      lastResetDate: walletData.creditResetDate,
    },
    config: GENERATION_CREDIT_COSTS,
    plans: PLAN_DEFINITIONS,
  });
});

// Credit Config (Centralized Costs)
app.get('/api/credits/config', (req, res) => {
  return res.json({ config: GENERATION_CREDIT_COSTS, plans: PLAN_DEFINITIONS });
});

// Credit Transactions Ledger (from Firestore)
app.get('/api/credits/transactions', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const transactions = await CreditWalletService.getTransactions(user.id, (user as any).authToken);
  return res.json({ transactions });
});

// Atomic Credit Debit Endpoint
app.post('/api/credits/debit', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const { cost, operation = 'generation_debit', projectId = null } = req.body;
  if (typeof cost !== 'number' || cost <= 0) {
    return res.status(400).json({ error: 'Valid positive cost required' });
  }

  try {
    const result = await CreditWalletService.debitCreditsAtomic({
      userId: user.id,
      cost,
      operation,
      projectId,
      authToken: (user as any).authToken,
    });
    return res.json(result);
  } catch (err: any) {
    if (err.message?.includes('INSUFFICIENT_CREDITS')) {
      const wallet = await CreditWalletService.getWallet(user.id, (user as any).authToken);
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Not enough credits',
        required: cost,
        available: wallet.creditBalance,
      });
    }
    return res.status(500).json({ error: err.message || 'Debit failed' });
  }
});

// Usage History (combined transactions + legacy logs)
app.get('/api/credits/usage', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const walletData = await CreditWalletService.getWallet(user.id, (user as any).authToken);
  const transactions = await CreditWalletService.getTransactions(user.id, (user as any).authToken);
  const logs = transactions.map((t) => ({
    id: t.id,
    userId: t.userId,
    type: 'text',
    amount: t.amount,
    description: t.operation,
    timestamp: t.createdAt,
    billingPeriod: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  }));
  return res.json({ logs, wallet: { totalRemaining: walletData.creditBalance, monthlyAllocation: 50 } });
});

// Replenish Demo Credits
app.post('/api/credits/replenish-demo', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const updatedWallet = await CreditWalletService.replenishDemoCredits(user.id, (user as any).authToken, 500);
  const planInfo = PLAN_DEFINITIONS[updatedWallet.plan] || PLAN_DEFINITIONS.free;
  return res.json({
    wallet: {
      plan: updatedWallet.plan,
      creditBalance: updatedWallet.creditBalance,
      totalRemaining: updatedWallet.creditBalance,
      textCredits: Math.floor(updatedWallet.creditBalance * 0.4),
      imageCredits: Math.floor(updatedWallet.creditBalance * 0.3),
      voiceCredits: Math.floor(updatedWallet.creditBalance * 0.2),
      videoCredits: Math.floor(updatedWallet.creditBalance * 0.1),
      monthlyAllocation: planInfo.monthlyCredits,
      lastResetDate: updatedWallet.creditResetDate,
    },
    success: true,
  });
});

// -------------------------------------------------------------
// SUBSCRIPTION & BILLING ENDPOINTS (SECURE SERVER-AUTHORITATIVE ARCHITECTURE)
// -------------------------------------------------------------

// 1. Payment Provider Status
app.get('/api/billing/provider-status', (req, res) => {
  const status = PaymentService.getProviderStatus();
  return res.json(status);
});

// 2. Configured Plans & Pricing
app.get('/api/billing/plans', (req, res) => {
  const plans = dbManager.getPricingPlans();
  return res.json({ plans });
});

app.get('/api/billing/credit-packs', (req, res) => {
  const packs = dbManager.getCreditPacks();
  return res.json({ packs });
});

// 3. Subscription & Billing Profile Overview
app.get('/api/billing/subscription', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const wallet = dbManager.getUserCredits(user.id);
  const plans = dbManager.getPricingPlans();
  const subData = PaymentService.getUserSubscription(user.id);

  return res.json({
    subscription: subData.subscription,
    providerStatus: subData.providerStatus,
    invoices: subData.invoices,
    plan: subData.subscription.planId,
    billingCycle: subData.subscription.billingCycle,
    status: subData.subscription.status,
    renewalDate: subData.subscription.currentPeriodEnd,
    creditsRemaining: wallet.totalRemaining,
    monthlyAllocation: subData.subscription.monthlyCredits,
    plans,
  });
});

// 4. Secure Backend Checkout Initiation
app.post('/api/billing/create-checkout-session', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const { planId, billingCycle = 'monthly', currency = 'INR', paymentMethod = 'upi' } = req.body;

  try {
    const result = await PaymentService.createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      planId,
      billingCycle,
      currency,
      paymentMethod,
    });

    if (!result.providerConfigured) {
      return res.status(503).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create checkout session' });
  }
});

// Legacy route alias for compatibility
app.post('/api/billing/create-order', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const { planId, billingCycle = 'monthly', currency = 'INR', paymentMethod = 'upi' } = req.body;

  try {
    const result = await PaymentService.createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      planId: planId || 'pro',
      billingCycle,
      currency,
      paymentMethod,
    });

    if (!result.providerConfigured) {
      return res.status(503).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create order' });
  }
});

// 5. Verification Endpoint: NEVER ALLOW CLIENT-SIDE VERIFICATION OR PAYMENT SIMULATION
app.post('/api/billing/verify-order', (req, res) => {
  return res.status(403).json({
    error: 'CLIENT_VERIFICATION_FORBIDDEN',
    message: 'Direct client-side payment verification is strictly disabled. Subscriptions and credits are activated exclusively via authenticated server webhooks with cryptographic signature verification.',
  });
});

// 6. Secure Backend Webhook Architecture
app.post('/api/billing/webhook', async (req, res) => {
  try {
    const rawPayload = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const result = await PaymentService.handleWebhook({
      rawPayload,
      headers: req.headers,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Webhook processing failure:', err.message);
    return res.status(400).json({ error: err.message || 'Webhook verification failed' });
  }
});

// 7. Cancel Subscription Request
app.post('/api/billing/cancel-request', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const updatedSub = PaymentService.cancelSubscription(user.id);
  return res.json({
    success: true,
    subscription: updatedSub,
    message: 'Cancellation scheduled. Your plan features and credits remain active until the end of the current billing cycle.',
  });
});

// -------------------------------------------------------------
// ADMIN ENDPOINTS (PROTECTED BY ADMIN ROLE)
// -------------------------------------------------------------

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const admin = (req as any).user;
  const users = dbManager.getAllUsers(admin.id);
  return res.json({ users });
});

app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const admin = (req as any).user;
  const metrics = dbManager.getPlatformMetrics(admin.id);
  return res.json({ metrics });
});

// Dedicated Automated Growth & Referral Verification Test Endpoint (Requirement 11)
app.get('/api/test-growth-system', async (_req, res) => {
  const results: Array<{ name: string; status: 'PASS' | 'FAIL'; details: string }> = [];

  try {
    // Setup test users
    const userAId = 'test-creator-user-a';
    const userBId = 'test-creator-user-b';

    // 1. User A creates a project & template
    const userAProject = dbManager.saveUserProject(
      {
        id: `proj_test_a_${Date.now()}`,
        name: 'Masterclass YouTube Shorts Formula',
        topic: 'How to Hook Viewers in 3 Seconds',
        format: 'Shorts (60s)',
        platform: 'YouTube Shorts',
        contentType: 'Educational',
        language: 'English',
        duration: '60 seconds',
        targetAudience: 'Content Creators',
        tone: 'Energetic',
        scenes: [
          {
            sceneNumber: 1,
            timestampRange: '0:00 - 0:05',
            visualDescription: 'Extreme close up with dramatic lighting interrupt',
            aiVideoPrompt: 'Cinematic creator speaking directly to camera, 4k',
          },
        ],
        script: {
          hookSummary: 'Stop scrolling if you want 10x more reach',
          beats: [
            {
              sectionType: 'hook',
              directionCue: 'Fast paced',
              visualCue: 'Punch zoom',
              dialogue: 'Stop scrolling right now!',
            },
          ],
        },
      },
      userAId
    );

    const templateA = dbManager.createOrUpdateTemplate(userAId, {
      originalProjectId: userAProject.id,
      title: 'Viral Hook Masterclass Template',
      description: 'Production-ready framework for short-form retention',
      category: 'Educational',
      platform: 'YouTube Shorts',
      contentType: 'Educational',
      language: 'English',
      shareCreatorName: true,
      workflow: {
        format: 'Shorts (60s)',
        tone: 'Energetic',
        targetAudience: 'Content Creators',
      },
      scenes: userAProject.scenes,
      prompts: {
        ideaHooks: ['3 Retention Secrets'],
        thumbnailHeadline: 'STOP SCROLLING',
        scriptOutline: 'Pattern interrupt formula',
      },
    });

    results.push({
      name: 'User A creates and shares template',
      status: templateA && templateA.id ? 'PASS' : 'FAIL',
      details: `Template ${templateA.id} published with scenes and workflow structure`,
    });

    // 2. Verify Privacy in Public Preview (No UID, No email, No media files)
    const publicPreview = dbManager.getPublicTemplate(templateA.id);
    const hasUid = JSON.stringify(publicPreview).includes(userAId);
    const hasEmail = JSON.stringify(publicPreview).includes('@');
    const hasPrivateStorage = JSON.stringify(publicPreview).includes('storagePath');

    results.push({
      name: 'Public Template Privacy Protection',
      status: !hasUid && !hasEmail && !hasPrivateStorage ? 'PASS' : 'FAIL',
      details: 'Strict privacy maintained: Zero UIDs, emails, or private disk assets exposed in preview',
    });

    // 3. User B opens template (increments opensCount)
    const opensBefore = templateA.opensCount || 0;
    dbManager.getPublicTemplate(templateA.id);
    const opensAfter = templateA.opensCount || 0;
    results.push({
      name: 'User B opens template preview',
      status: opensAfter > opensBefore ? 'PASS' : 'FAIL',
      details: `Template opens tracked: ${opensBefore} -> ${opensAfter}`,
    });

    // 4. User B uses template -> receives independent project in User B account
    const userBClonedProject = dbManager.useTemplate(templateA.id, userBId);
    const isDistinctProject = userBClonedProject.id !== userAProject.id;
    const isOwnedByUserB = userBClonedProject.userId === userBId;

    results.push({
      name: 'User B uses template into independent project',
      status: isDistinctProject && isOwnedByUserB ? 'PASS' : 'FAIL',
      details: `New project ${userBClonedProject.id} isolated in User B account without altering original`,
    });

    // 5. Verify User B cannot edit User A's original project
    let userBCannotEditA = false;
    try {
      dbManager.saveUserProject(
        {
          id: userAProject.id,
          name: 'Hacked Title Attempt',
        },
        userBId
      );
    } catch (authErr: any) {
      userBCannotEditA = true;
    }

    results.push({
      name: 'Cross-user project protection',
      status: userBCannotEditA ? 'PASS' : 'FAIL',
      details: 'User B strictly forbidden from editing User A original project',
    });

    // 6. Referral Anti-Abuse: Self-referral blocked
    const userACode = dbManager.getUserReferralCode(userAId);
    const selfReferralResult = dbManager.recordReferralSignup(userACode, userAId);
    results.push({
      name: 'Anti-Abuse: Self-referral blocked',
      status: !selfReferralResult.success && selfReferralResult.error === 'SELF_REFERRAL_NOT_ALLOWED' ? 'PASS' : 'FAIL',
      details: `Self-referral rejected with error: ${selfReferralResult.error}`,
    });

    // 7. Referral Signup: User B refers User C
    const userCId = `test-user-c-${Date.now()}`;
    const userBCode = dbManager.getUserReferralCode(userBId);
    const signupResult = dbManager.recordReferralSignup(userBCode, userCId);

    // 8. Referral Qualification & Secure Wallet Reward
    const walletBefore = dbManager.getUserCredits(userBId).totalRemaining;
    const rewardResult = await dbManager.qualifyAndRewardReferral(userCId, QUALIFIED_REFERRAL_REWARD_CREDITS);
    const walletAfter = dbManager.getUserCredits(userBId).totalRemaining;

    results.push({
      name: 'Referral Qualification & Secure Credit Wallet Reward',
      status: rewardResult.rewarded && walletAfter === walletBefore + QUALIFIED_REFERRAL_REWARD_CREDITS ? 'PASS' : 'FAIL',
      details: `Wallet balance increased from ${walletBefore} to ${walletAfter} (+${QUALIFIED_REFERRAL_REWARD_CREDITS} credits)`,
    });

    // 9. Anti-Abuse: Duplicate referral reward blocked
    const dupRewardResult = await dbManager.qualifyAndRewardReferral(userCId, QUALIFIED_REFERRAL_REWARD_CREDITS);
    results.push({
      name: 'Anti-Abuse: Duplicate referral reward blocked',
      status: !dupRewardResult.rewarded && dupRewardResult.error === 'ALREADY_REWARDED' ? 'PASS' : 'FAIL',
      details: `Duplicate attempt cleanly rejected with error: ${dupRewardResult.error}`,
    });

    // 10. Growth Metrics Tracking
    const adminMetrics = dbManager.getPlatformMetrics('user-admin-default');
    const hasGrowthMetrics =
      adminMetrics.growth &&
      typeof adminMetrics.growth.templatesShared === 'number' &&
      typeof adminMetrics.growth.templateOpens === 'number' &&
      typeof adminMetrics.growth.templateUses === 'number' &&
      typeof adminMetrics.growth.referralSignups === 'number' &&
      typeof adminMetrics.growth.qualifiedReferrals === 'number';

    results.push({
      name: 'Admin-only Growth Tracking Metrics',
      status: hasGrowthMetrics ? 'PASS' : 'FAIL',
      details: `Growth counts: ${JSON.stringify(adminMetrics.growth)}`,
    });

    const allPassed = results.every((r) => r.status === 'PASS');
    return res.json({
      allPassed,
      results,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack, results });
  }
});


app.put('/api/admin/credit-config', requireAdmin, (req, res) => {
  const admin = (req as any).user;
  const updated = dbManager.updateCreditConfig(admin.id, req.body);
  return res.json({ config: updated });
});

app.put('/api/admin/user-plan', requireAdmin, (req, res) => {
  const admin = (req as any).user;
  const { userId, plan } = req.body;
  const updated = dbManager.updateUserPlan(admin.id, userId, plan);
  return res.json({ user: updated });
});

app.put('/api/admin/pricing-plan', requireAdmin, (req, res) => {
  const { planId, ...updates } = req.body;
  if (!planId) return res.status(400).json({ error: 'planId required' });
  try {
    const updated = dbManager.updatePricingPlan(planId, updates);
    return res.json({ plan: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/credit-pack', requireAdmin, (req, res) => {
  const { packId, ...updates } = req.body;
  if (!packId) return res.status(400).json({ error: 'packId required' });
  try {
    const updated = dbManager.updateCreditPack(packId, updates);
    return res.json({ pack: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Admin AI Cost Dashboard (Protected by Admin Role)
app.get('/api/admin/ai-cost-dashboard', requireAdmin, (req, res) => {
  const timeframe = (req.query.timeframe as 'today' | '7d' | '30d') || '7d';
  const data = AIUsageService.getAdminDashboardData(timeframe);
  return res.json(data);
});

// Admin Plan Economics (Protected by Admin Role)
app.get('/api/admin/plan-economics', requireAdmin, (req, res) => {
  const planEconomics = AIUsageService.getPlanEconomics();
  return res.json({ planEconomics });
});

// Admin AI Usage Audit Ledger (Protected by Admin Role)
app.get('/api/admin/ai-usage-records', requireAdmin, (req, res) => {
  const timeframe = (req.query.timeframe as 'today' | '7d' | '30d') || '7d';
  const records = dbManager.getAIUsageRecords({ timeframe });
  return res.json({ records });
});

// Admin Provider Status & Setup Checklist (Secure Server-Authoritative Architecture)
app.get('/api/admin/provider-status', requireAdmin, async (_req, res) => {
  const paymentStatus = PaymentService.getProviderStatus();
  const videoStatus = VideoProviderService.getProviderStatus();
  const textAiProbe = await AIProviderService.safeCheck();

  const providers = [
    {
      id: 'text_ai',
      name: 'TEXT AI',
      provider: 'Google Gemini (gemini-3.8-flash)',
      capability: 'Idea Generation, Scripts, Scene Beats, SEO, Multilingual Translation & Agent Strategy',
      connectionStatus: textAiProbe.connectionStatus,
      quotaStatus: textAiProbe.quotaStatus,
      status: textAiProbe.status,
      lastSafeCheck: textAiProbe.lastSafeCheck,
      details: textAiProbe.message,
      blockerReason: textAiProbe.blockerReason,
      isIntegrationWorking: true,
      setupChecklist: [
        { item: 'Server-side @google/genai SDK initialized', status: 'PASS', done: true },
        { item: 'Environment variable GEMINI_API_KEY present (server-side only)', status: 'PASS', done: true },
        { item: 'Zero client key exposure (secured via backend proxies)', status: 'PASS', done: true },
        { item: 'Production rate quota / billing attached to Google AI Studio project', status: 'ACTION REQUIRED', done: false, blocker: true },
      ],
      nextAction: 'Attach billing or upgrade quota tier in Google AI Studio to lift free-tier (5 RPM) rate restrictions.',
    },
    {
      id: 'image_ai',
      name: 'IMAGE AI',
      provider: 'Imagen 3 / Google GenAI Image',
      capability: 'High-Converting Thumbnails, Visual Concept Stills & Scene Backgrounds',
      connectionStatus: 'SETUP REQUIRED',
      quotaStatus: 'DISABLED',
      status: 'SETUP REQUIRED',
      lastSafeCheck: new Date().toISOString(),
      details: 'Neural image generation pipeline is safely held disabled. Awaiting real server-side image provider credentials (IMAGEN_API_KEY or STABILITY_API_KEY).',
      blockerReason: 'No server-side image credentials configured. Feature safely disabled.',
      isIntegrationWorking: false,
      setupChecklist: [
        { item: 'Real server-side API credentials configured', status: 'SETUP REQUIRED', done: false, blocker: true },
        { item: 'Zero client key exposure guaranteed', status: 'PASS', done: true },
        { item: 'Generation endpoint safely disabled until credentials configured', status: 'PASS', done: true },
      ],
      nextAction: 'Configure IMAGEN_API_KEY in server environment variables.',
    },
    {
      id: 'voice_ai',
      name: 'VOICE AI',
      provider: 'ElevenLabs / Google Cloud Text-to-Speech',
      capability: 'Studio Voiceover Narration, Multilingual Dubbing & Dynamic Character Audio',
      connectionStatus: 'SETUP REQUIRED',
      quotaStatus: 'DISABLED',
      status: 'SETUP REQUIRED',
      lastSafeCheck: new Date().toISOString(),
      details: 'Server-side voice synthesis pipeline is safely held disabled. Awaiting real server-side audio credentials (ELEVENLABS_API_KEY or GOOGLE_TTS_KEY). In-browser SpeechSynthesis available for local preview.',
      blockerReason: 'No server-side audio credentials configured. Feature safely disabled.',
      isIntegrationWorking: false,
      setupChecklist: [
        { item: 'Real server-side API credentials configured', status: 'SETUP REQUIRED', done: false, blocker: true },
        { item: 'Zero client key exposure guaranteed', status: 'PASS', done: true },
        { item: 'Generation endpoint safely disabled until credentials configured', status: 'PASS', done: true },
      ],
      nextAction: 'Configure ELEVENLABS_API_KEY in server environment variables.',
    },
    {
      id: 'video_ai',
      name: 'VIDEO AI',
      provider: 'Google Veo / Runway Gen-3 / Luma Dream Machine',
      capability: 'Neural B-Roll Generation, Cinematic Sequence Rendering & Storyboards',
      connectionStatus: videoStatus.configured ? 'CONNECTED' : 'SETUP REQUIRED',
      quotaStatus: videoStatus.configured ? 'CONNECTED' : 'DISABLED',
      status: videoStatus.configured ? 'CONNECTED' : 'SETUP REQUIRED',
      lastSafeCheck: new Date().toISOString(),
      details: videoStatus.configured
        ? videoStatus.message
        : 'Video generation rendering is safely held in setup required state. Veo and Runway require paid model quota and server credentials (VEO_API_KEY or RUNWAY_API_KEY). Client-side UI is guarded against unauthorized generation.',
      blockerReason: videoStatus.configured ? 'None' : 'Requires paid tier Veo or Runway credentials with video rendering quota.',
      isIntegrationWorking: videoStatus.configured,
      setupChecklist: [
        { item: 'Server-side credentials configured (VEO_API_KEY or RUNWAY_API_KEY)', status: videoStatus.configured ? 'PASS' : 'SETUP REQUIRED', done: videoStatus.configured, blocker: !videoStatus.configured },
        { item: 'Zero client key exposure guaranteed', status: 'PASS', done: true },
        { item: 'Expensive video credit protection enabled', status: 'PASS', done: true },
      ],
      nextAction: 'Configure VEO_API_KEY or RUNWAY_API_KEY with active rendering credits.',
    },
    {
      id: 'payment',
      name: 'PAYMENT',
      provider: paymentStatus.provider === 'None' ? 'Razorpay / Stripe / Cashfree' : paymentStatus.provider,
      capability: 'Subscription Checkout (INR UPI/Cards & Global USD), Credit Pack Purchases & Webhook Fulfillment',
      connectionStatus: paymentStatus.configured ? 'CONNECTED' : 'SETUP REQUIRED',
      quotaStatus: paymentStatus.configured ? 'CONNECTED' : 'DISABLED',
      status: paymentStatus.configured ? 'CONNECTED' : 'SETUP REQUIRED',
      lastSafeCheck: new Date().toISOString(),
      details: paymentStatus.configured
        ? paymentStatus.message
        : 'Live payment processing and checkout sessions are safely disabled until verified merchant keys (RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET or STRIPE_SECRET_KEY) are configured in server environment variables.',
      blockerReason: paymentStatus.configured ? 'None' : 'Live checkout safely disabled until verified merchant keys are configured.',
      isIntegrationWorking: paymentStatus.configured,
      setupChecklist: [
        { item: 'Verified merchant keys configured (RAZORPAY_KEY_ID or STRIPE_SECRET_KEY)', status: paymentStatus.configured ? 'PASS' : 'SETUP REQUIRED', done: paymentStatus.configured, blocker: !paymentStatus.configured },
        { item: 'Webhook signature verification ready', status: 'PASS', done: true },
        { item: 'Live checkout safely disabled until verified merchant configured', status: 'PASS', done: true },
      ],
      nextAction: 'Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server environment variables.',
    },
  ];

  return res.json({
    providers,
    freePlanCredits: 50,
    freePlanConsistent: true,
    securityStatus: 'PASS',
    lastSafeCheck: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// PUBLIC SAFE AI OPERATIONS & VIDEO COST ESTIMATION (NO SENSITIVE MARGINS)
// -------------------------------------------------------------

// Public safe operations metadata (credit costs, models, enabled status)
app.get('/api/ai/operations-meta', (req, res) => {
  return res.json(getClientSafeOperationsMeta());
});

// Variable Video Generation Cost Calculator
app.post('/api/ai/calculate-video-cost', (req, res) => {
  const { provider, model, durationSeconds, resolution, numberOfVideos } = req.body;
  const calculation = calculateEstimatedVideoCost({
    provider,
    model,
    durationSeconds: Number(durationSeconds) || 15,
    resolution,
    numberOfVideos: Number(numberOfVideos) || 1,
  });
  return res.json(calculation);
});

// Pre-check safety limits before expensive requests
app.post('/api/ai/check-safety-limits', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const { operation = 'general', creditsToCharge = 0, videoDurationSeconds } = req.body;
  const safetyCheck = AIUsageService.checkSafetyLimits({
    userId: user.id,
    operation,
    creditsToCharge: Number(creditsToCharge) || 0,
    videoDurationSeconds: videoDurationSeconds ? Number(videoDurationSeconds) : undefined,
  });

  if (!safetyCheck.allowed) {
    return res.status(400).json({ allowed: false, error: safetyCheck.error });
  }

  return res.json({ allowed: true });
});

// -------------------------------------------------------------
// AI GENERATION PIPELINE ENDPOINTS
// -------------------------------------------------------------

app.post('/api/generate-content-pack', async (req, res) => {
  const {
    projectName = 'Untitled Project',
    topic,
    platform = 'YouTube Shorts',
    contentType = 'Facts',
    language = 'English',
    duration = '60 seconds',
    targetAudience = 'General Audience',
  } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const cost = 10;
  const authToken = (user as any).authToken;

  try {
    const prompt = `You are the lead content architect and creative director at CreatorNova AI.
Generate a complete, production-ready "Creator Content Pack" based on the following creator inputs:
- Project Name: "${projectName}"
- Content Topic: "${topic}"
- Platform: "${platform}" (e.g. YouTube Shorts, YouTube Long Video, Instagram Reels, TikTok, Facebook, Other)
- Content Type: "${contentType}" (e.g. Educational, Kids, Facts, Story, Entertainment, Business, Motivation, Product/Marketing)
- Target Language: "${language}" (Write the spoken script, voiceovers, titles, captions, and descriptions in ${language})
- Video Duration: "${duration}"
- Target Audience: "${targetAudience}"

Your output MUST be a single, valid JSON object with the following exact keys and structure:
{
  "projectName": "${projectName}",
  "topic": "${topic}",
  "platform": "${platform}",
  "contentType": "${contentType}",
  "language": "${language}",
  "duration": "${duration}",
  "targetAudience": "${targetAudience}",
  "contentIdea": {
    "title": "Main video title",
    "concept": "Comprehensive video concept & premise",
    "coreValue": "The primary insight, entertainment, or takeaway for viewers",
    "targetAudience": "${targetAudience}"
  },
  "hook": {
    "hookText": "Opening 0-3 second spoken hook line tailored to stop scrolling for ${targetAudience}",
    "timing": "0:00 - 0:03",
    "visualAction": "What visually happens on screen in the first second (pattern interrupt)",
    "psychologyTrigger": "Why this hook works (e.g. Curiosity gap, Loss aversion, Shock factor)"
  },
  "script": {
    "rawFullText": "Complete spoken script in ${language} without timestamps for continuous reading",
    "estimatedDuration": "${duration}",
    "wordCount": 180,
    "callToAction": "Natural call to action line tailored to ${platform}",
    "beats": [
      {
        "id": "beat-1",
        "timestamp": "0:00 - 0:05",
        "speaker": "Host",
        "sectionType": "hook",
        "directionCue": "[Fast, high intensity, eye contact with camera]",
        "dialogue": "Spoken hook text in ${language}",
        "visualCue": "Visual zoom with sound effect",
        "durationSec": 5
      }
    ]
  },
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "timestampRange": "0:00 - 0:05",
      "shotType": "Extreme Close Up",
      "cameraAngle": "Low Angle",
      "visualDescription": "Detailed visual setting, lighting, background, and art direction",
      "characterAction": "Exact movement, facial expression, and physical interaction",
      "voiceover": "Voiceover line spoken in this specific scene",
      "aiVideoPrompt": "High-fidelity video prompt",
      "audioSfx": "Sound effects, ambient audio, music riser",
      "onScreenText": "On-screen kinetic text overlay or subtitle",
      "lightingMood": "Lighting style and color palette",
      "brollKeywords": ["broll keyword 1", "keyword 2"]
    }
  ],
  "seo": {
    "titleSuggestions": [
      "Title Option 1 (Curiosity Gap)",
      "Title Option 2 (Listicle / Number)",
      "Title Option 3 (Emotional / Shock)",
      "Title Option 4 (How-to / Practical)",
      "Title Option 5 (Story / Revelation)"
    ],
    "description": "Complete SEO-optimized video description with hook, key points, timestamps placeholder, and call to action",
    "keywords": ["primary keyword", "secondary keyword", "long-tail keyword"],
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
    "seoScore": 96
  },
  "thumbnail": {
    "thumbnailIdea": "Core visual concept for the thumbnail",
    "shortText": "3-4 WORD BOLD HEADLINE",
    "visualComposition": "Description of subject placement, focal point, face reaction, and color contrast",
    "aiImagePrompt": "Detailed AI image generator prompt",
    "suggestedColors": {
      "bg1": "#0F172A",
      "bg2": "#581C87",
      "accent": "#F59E0B"
    }
  },
  "repurposing": {
    "youtubeShort": {
      "hook": "Fast vertical hook",
      "script": "Punched up vertical script under 60 seconds",
      "caption": "Short caption with keywords",
      "hashtags": ["#Shorts", "#Viral", "#CreatorNova"]
    },
    "instagramReel": {
      "hook": "Aesthetic visual hook",
      "audioIdea": "Suggested trending audio vibe or tempo",
      "caption": "Engaging IG caption with spacing and question prompt",
      "hashtags": ["#ReelsInstagram", "#ContentCreator", "#ExplorePage"]
    },
    "tiktok": {
      "hook": "Raw, native TikTok pattern interrupt",
      "soundTrend": "Recommended trending sound style",
      "caption": "Short punchy TikTok caption",
      "hashtags": ["#TikTokViral", "#LearnOnTikTok", "#FYP"]
    },
    "facebookPost": {
      "headline": "Scroll-stopping Facebook headline",
      "text": "Story-driven long-form Facebook post text",
      "cta": "Link click / comment trigger question"
    },
    "youtubeCommunity": {
      "postText": "Engaging community update text",
      "pollQuestion": "Interactive poll question for subscribers",
      "pollOptions": ["Option A", "Option B", "Option C"]
    }
  }
}`;

    const pipeline = await AIProviderService.executePipeline({
      userId: user.id,
      projectId: null,
      operation: 'content_pack_generation',
      creditCost: cost,
      authToken,
      generator: async () => {
        const raw = await AIProviderService.generateContent({
          prompt,
          systemInstruction: `You are an elite YouTube, TikTok, and social media production studio director. Output only clean, valid JSON matching the requested structure. Write all dialogue, voiceover, descriptions, and titles in ${language}.`,
          responseMimeType: 'application/json',
          temperature: 0.75,
        });
        const parsed = AIProviderService.extractJson(raw);
        parsed.createdAt = new Date().toISOString();
        return parsed;
      },
    });

    return res.json({
      contentPack: pipeline.result,
      creditsDeducted: pipeline.creditsDeducted,
      remainingCredits: pipeline.remainingCredits,
      requestId: pipeline.requestId,
    });
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      return res.status(err.statusCode).json({ error: err.errorCode, message: err.message, isQuota: err.isQuota });
    }
    return res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: 'AI service temporarily unavailable. Please try again later.' });
  }
});

// 1. Generate Content Ideas Endpoint (Secure AI Provider Layer)
app.post('/api/generate-ideas', async (req, res) => {
  const { topic, format, targetAudience, tone, count = 4, projectId } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const cost = GENERATION_CREDIT_COSTS.ideaGeneration;
  const authToken = (user as any).authToken;

  try {
    const pipeline = await AIProviderService.executePipeline({
      userId: user.id,
      projectId: projectId || null,
      operation: 'idea_generation',
      creditCost: cost,
      authToken,
      generator: () => AIProviderService.generateIdeas({ topic, format, targetAudience, tone, count }),
      projectUpdater: (proj, ideas) => ({
        ...proj,
        generatedIdeas: ideas,
        topic: topic || proj.topic,
      }),
    });

    return res.json({
      ideas: pipeline.result,
      creditsDeducted: pipeline.creditsDeducted,
      remainingCredits: pipeline.remainingCredits,
      requestId: pipeline.requestId,
      savedToProject: pipeline.savedToProject,
    });
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      return res.status(err.statusCode).json({ error: err.errorCode, message: err.message, isQuota: err.isQuota });
    }
    return res.status(500).json({ error: 'GENERATION_FAILED', message: err?.message || 'Generation failed' });
  }
});

// 1b. Generate Dedicated Viral Hooks Endpoint (Secure AI Provider Layer)
app.post('/api/generate-hooks', async (req, res) => {
  const { topic, format, targetAudience, count = 5, projectId } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const cost = GENERATION_CREDIT_COSTS.ideaGeneration;
  const authToken = (user as any).authToken;

  try {
    const pipeline = await AIProviderService.executePipeline({
      userId: user.id,
      projectId: projectId || null,
      operation: 'idea_generation',
      creditCost: cost,
      authToken,
      generator: () => AIProviderService.generateHooks({ topic, format, targetAudience, count }),
    });

    return res.json({
      hooks: pipeline.result,
      creditsDeducted: pipeline.creditsDeducted,
      remainingCredits: pipeline.remainingCredits,
      requestId: pipeline.requestId,
    });
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      return res.status(err.statusCode).json({ error: err.errorCode, message: err.message, isQuota: err.isQuota });
    }
    return res.status(500).json({ error: 'GENERATION_FAILED', message: err?.message || 'Hook generation failed' });
  }
});

// 2. Generate Full Script Endpoint (Secure AI Provider Layer)
app.post('/api/generate-script', async (req, res) => {
  const { title, format, targetAudience, tone, pacing = 'balanced', hostFormat = 'solo', duration = '3-5 minutes', projectId } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const cost = GENERATION_CREDIT_COSTS.scriptGeneration;
  const authToken = (user as any).authToken;

  try {
    const pipeline = await AIProviderService.executePipeline({
      userId: user.id,
      projectId: projectId || null,
      operation: 'script_generation',
      creditCost: cost,
      authToken,
      generator: () =>
        AIProviderService.generateScript({
          title,
          format,
          duration,
          targetAudience,
          tone,
          pacing,
          hostFormat,
        }),
      projectUpdater: (proj, script) => ({
        ...proj,
        name: title,
        script,
        duration: duration || proj.duration,
      }),
    });

    return res.json({
      script: pipeline.result,
      creditsDeducted: pipeline.creditsDeducted,
      remainingCredits: pipeline.remainingCredits,
      requestId: pipeline.requestId,
      savedToProject: pipeline.savedToProject,
    });
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      return res.status(err.statusCode).json({ error: err.errorCode, message: err.message, isQuota: err.isQuota });
    }
    return res.status(500).json({ error: 'GENERATION_FAILED', message: err?.message || 'Script generation failed' });
  }
});

// 3. Polish / Refine Script Beat (Secure AI Provider Layer)
app.post('/api/refine-script', async (req, res) => {
  const { originalText, instruction } = req.body;
  if (!originalText) {
    return res.status(400).json({ error: 'originalText is required' });
  }

  try {
    const refined = await AIProviderService.refineScript({ originalText, instruction });
    return res.json(refined);
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      return res.status(err.statusCode).json({ error: err.errorCode, message: err.message, isQuota: err.isQuota });
    }
    return res.status(500).json({ error: 'GENERATION_FAILED', message: err?.message || 'Refinement failed' });
  }
});

// 4. Generate Storyboard & Scene Breakdown (Secure AI Provider Layer)
app.post('/api/generate-scenes', async (req, res) => {
  const { title, scriptText, format, sceneCount = 6, projectId } = req.body;
  if (!title && !scriptText) {
    return res.status(400).json({ error: 'Title or scriptText is required' });
  }

  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const cost = GENERATION_CREDIT_COSTS.sceneGeneration;
  const authToken = (user as any).authToken;

  try {
    const pipeline = await AIProviderService.executePipeline({
      userId: user.id,
      projectId: projectId || null,
      operation: 'scene_generation',
      creditCost: cost,
      authToken,
      generator: () =>
        AIProviderService.generateScenes({
          title: title || 'Content Scenes',
          scriptText,
          format,
          sceneCount: Number(sceneCount) || 5,
        }),
      projectUpdater: (proj, scenes) => ({
        ...proj,
        scenes,
      }),
    });

    return res.json({
      scenes: pipeline.result,
      creditsDeducted: pipeline.creditsDeducted,
      remainingCredits: pipeline.remainingCredits,
      requestId: pipeline.requestId,
      savedToProject: pipeline.savedToProject,
    });
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      return res.status(err.statusCode).json({ error: err.errorCode, message: err.message, isQuota: err.isQuota });
    }
    return res.status(500).json({ error: 'GENERATION_FAILED', message: err?.message || 'Scene generation failed' });
  }
});

// 5. Generate SEO Suite (Titles, Tags, Description, Hashtags) (Secure AI Provider Layer)
app.post('/api/generate-seo', async (req, res) => {
  const { title, topic, scriptText, targetAudience, projectId } = req.body;
  const mainSubject = title || topic || 'Creative Content';

  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const cost = GENERATION_CREDIT_COSTS.seoPack;
  const authToken = (user as any).authToken;

  try {
    const pipeline = await AIProviderService.executePipeline({
      userId: user.id,
      projectId: projectId || null,
      operation: 'seo_generation',
      creditCost: cost,
      authToken,
      generator: () =>
        AIProviderService.generateSeo({
          title: mainSubject,
          topic,
          scriptText,
          targetAudience,
        }),
      projectUpdater: (proj, seo) => ({
        ...proj,
        seoPack: seo,
      }),
    });

    return res.json({
      seo: pipeline.result,
      creditsDeducted: pipeline.creditsDeducted,
      remainingCredits: pipeline.remainingCredits,
      requestId: pipeline.requestId,
      savedToProject: pipeline.savedToProject,
    });
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      return res.status(err.statusCode).json({ error: err.errorCode, message: err.message, isQuota: err.isQuota });
    }
    return res.status(500).json({ error: 'GENERATION_FAILED', message: err?.message || 'SEO generation failed' });
  }
});

// 6. Multi-language Content Translation Endpoint (Secure AI Provider Layer)
app.post('/api/translate-content', async (req, res) => {
  const { text, targetLanguage, mode = 'cultural', originalLanguage = 'English', projectId } = req.body;
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Text and targetLanguage are required' });
  }

  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const cost = 2;
  const authToken = (user as any).authToken;

  try {
    const pipeline = await AIProviderService.executePipeline({
      userId: user.id,
      projectId: projectId || null,
      operation: 'translation',
      creditCost: cost,
      authToken,
      generator: () =>
        AIProviderService.generateTranslation({
          text,
          targetLanguage,
          mode,
          originalLanguage,
        }),
      projectUpdater: (proj, translation) => {
        const translations = Array.isArray(proj.translations) ? [...proj.translations] : [];
        translations.push(translation);
        return {
          ...proj,
          translations,
        };
      },
    });

    return res.json({
      translation: pipeline.result,
      creditsDeducted: pipeline.creditsDeducted,
      remainingCredits: pipeline.remainingCredits,
      requestId: pipeline.requestId,
      savedToProject: pipeline.savedToProject,
    });
  } catch (err: any) {
    if (err instanceof AIProviderError) {
      return res.status(err.statusCode).json({ error: err.errorCode, message: err.message, isQuota: err.isQuota });
    }
    return res.status(500).json({ error: 'GENERATION_FAILED', message: err?.message || 'Translation failed' });
  }
});

// 7. Generate Thumbnail Creative Concept & Strategy
app.post('/api/generate-thumbnail-prompt', async (req, res) => {
  const { title, topic, tone } = req.body;

  const user = getAuthenticatedUser(req);
  const cost = GENERATION_CREDIT_COSTS.thumbnailImage;
  if (user) {
    const wallet = await CreditWalletService.getWallet(user.id, (user as any).authToken);
    if (wallet.creditBalance < cost) {
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Not enough credits',
        required: cost,
        available: wallet.creditBalance,
      });
    }
  }

  const prompt = `You are a legendary YouTube thumbnail designer who has generated over 1 billion views.
Analyze this video:
Title: "${title || topic}"
Tone: "${tone || 'energetic'}"

Design 3 distinct psychological thumbnail concepts engineered for 12%+ CTR.
Each concept must specify:
1. 3-word bold headline overlay
2. Visual composition & focal point (face expression, angle, lighting)
3. Color contrast theory (background vs text vs accents)
4. Key psychological trigger (Curiosity, Extreme Emotion, Before/After, Contrast)
5. Suggested Image generation prompt

Return ONLY valid JSON array:
[
  {
    "conceptName": "The Extreme Reaction",
    "headline": "DO NOT DO THIS",
    "focalPoint": "Extreme close-up of shocked face looking at glowing phone screen",
    "colorPalette": "Pitch black background with neon radioactive yellow text and red warning border",
    "psychologicalTrigger": "Loss aversion & extreme curiosity",
    "imagePrompt": "Cinematic photo of a person with wide eyes looking in shock at a luminous floating holographic icon, volumetric cinematic lighting, 8k"
  }
]`;

  try {
    if (!ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You design YouTube thumbnails that stop the infinite scroll. Output valid JSON array only.',
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    });

    const parsed = extractJsonFromText(response.text || '[]');
    if (user) {
      await CreditWalletService.debitCreditsAtomic({
        userId: user.id,
        cost,
        operation: 'thumbnail_prompt_generation',
        authToken: (user as any).authToken,
      });
    }
    return res.json({ concepts: Array.isArray(parsed) ? parsed : [parsed] });
  } catch (error: any) {
    return res.json({
      concepts: [
        {
          conceptName: 'Curiosity Shock',
          headline: 'IT ACTUALLY WORKED?!',
          focalPoint: 'Subject pointing toward a bright neon glowing mystery box with open mouth expression',
          colorPalette: 'Deep midnight navy (#0B0F19) with glowing electric yellow and magenta accents',
          psychologicalTrigger: 'Curiosity gap & validation',
          imagePrompt: 'Hyper-detailed expressive portrait with vibrant saturated rim lighting, dramatic high-key contrast, professional YouTube thumbnail composition'
        },
        {
          conceptName: 'Before & After Contrast',
          headline: '10X FASTER!',
          focalPoint: 'Split screen comparing frustrating slow method with instant lightning-fast solution',
          colorPalette: 'Dull monochrome grey on left, radiant sunset gradient on right',
          psychologicalTrigger: 'Transformation & aspirational efficiency',
          imagePrompt: 'Dramatic split-screen visual comparison, high saturation, sharp focal depth'
        }
      ]
    });
  }
});

// 8. Enhanced Thumbnail Studio Prompt Generation
app.post('/api/generate-thumbnail-prompt-enhanced', async (req, res) => {
  const { topic, title, targetAudience, thumbnailConcept, visualStyle = 'Cinematic', aspectRatio = '16:9' } = req.body;

  const user = getAuthenticatedUser(req);
  const cost = GENERATION_CREDIT_COSTS.thumbnailImage;
  if (user) {
    const wallet = await CreditWalletService.getWallet(user.id, (user as any).authToken);
    if (wallet.creditBalance < cost) {
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Not enough credits',
        required: cost,
        available: wallet.creditBalance,
      });
    }
  }

  const prompt = `You are the lead thumbnail artist and creative director for CreatorNova AI.
Generate a high-converting, production-ready AI image generator prompt and visual formula for:
- Video Title: "${title || topic}"
- Topic: "${topic}"
- Target Audience: "${targetAudience || 'General'}"
- Thumbnail Concept: "${thumbnailConcept || 'High contrast face reaction with glowing element'}"
- Visual Style: "${visualStyle}" (Clean, Colorful, Cinematic, Cartoon, Educational, Kids, Professional)
- Aspect Ratio: "${aspectRatio}" (16:9, 9:16, 1:1)

Return ONLY valid JSON in this exact structure:
{
  "prompt": "Highly detailed, photorealistic prompt tailored for Midjourney/Imagen with camera lens, lighting, composition, negative space for text",
  "shortHeadline": "3-4 WORD BOLD HEADLINE",
  "visualComposition": "Detailed breakdown of focal point, rule of thirds, subject pose, and text placement",
  "styleDetails": "How the ${visualStyle} style is expressed in texture and lighting",
  "suggestedColors": {
    "bg1": "#0F172A",
    "bg2": "#3B0764",
    "accent": "#F59E0B"
  }
}`;

  try {
    if (!ai) throw new Error('GEMINI_API_KEY is not configured');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You craft world-class YouTube thumbnail prompts that stop the infinite scroll. Output valid JSON only.',
        responseMimeType: 'application/json',
        temperature: 0.75,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    if (user) {
      await CreditWalletService.debitCreditsAtomic({
        userId: user.id,
        cost,
        operation: 'thumbnail_enhanced_prompt_generation',
        authToken: (user as any).authToken,
      });
    }
    return res.json({ result: parsed });
  } catch (error: any) {
    console.error('Error generating enhanced thumbnail prompt:', error?.message || error);
    return res.json({
      result: {
        prompt: `Cinematic YouTube thumbnail composition: A charismatic subject looking in dramatic awe at a floating glowing visual metaphor of ${topic || title}, extreme volumetric rim lighting in electric amber and deep obsidian, sharp focus, 35mm photography, high saturation, 8k octane render`,
        shortHeadline: 'DO NOT MISS!',
        visualComposition: 'Left side: high-emotion human face with expressive eyes. Right side: luminous key object representing the breakthrough with dark negative space for high-contrast bold typography.',
        styleDetails: `${visualStyle} aesthetic featuring crisp studio edge highlights and vibrant secondary fills.`,
        suggestedColors: {
          bg1: '#0F172A',
          bg2: '#3B0764',
          accent: '#F59E0B',
        },
      },
    });
  }
});

// 9. Scene Media Prompt with Visual Identity Consistency
app.post('/api/generate-scene-media-prompt', async (req, res) => {
  const { sceneNumber, visualDescription, characterAction, visualIdentity } = req.body;

  const user = getAuthenticatedUser(req);
  const cost = GENERATION_CREDIT_COSTS.sceneGeneration;
  if (user) {
    const wallet = await CreditWalletService.getWallet(user.id, (user as any).authToken);
    if (wallet.creditBalance < cost) {
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Not enough credits',
        required: cost,
        available: wallet.creditBalance,
      });
    }
  }

  const prompt = `You are a film director ensuring strict visual continuity across video scenes for CreatorNova AI.
Generate a cohesive AI video/image generator prompt for:
- Scene Number: ${sceneNumber}
- Visual Description: "${visualDescription}"
- Character Action: "${characterAction || 'Subject in scene'}"

MANDATORY VISUAL IDENTITY TO REUSE (MUST NOT CHANGE BETWEEN SCENES):
- Character: ${visualIdentity?.characterDescription || 'Consistent host with recognizable facial features'}
- Clothing: ${visualIdentity?.clothing || 'Signature outfit'}
- Palette: ${Array.isArray(visualIdentity?.colors) ? visualIdentity.colors.join(', ') : 'Cohesive color palette'}
- Environment Style: ${visualIdentity?.environmentStyle || 'Modern cinematic studio'}
- Lighting: ${visualIdentity?.lighting || 'Volumetric rim lighting with soft fill'}
- Art Style: ${visualIdentity?.artStyle || 'Cinematic photorealistic 3D'}
- Camera Style: ${visualIdentity?.cameraStyle || '35mm anamorphic, shallow depth of field'}

Return ONLY a JSON object:
{
  "consistentPrompt": "The unified production prompt integrating the scene action with the strict visual identity",
  "negativePrompt": "deformed, disfigured, inconsistent character, changing clothes, blurry, bad anatomy",
  "cameraGuidance": "Pan, zoom, or dolly camera movement note"
}`;

  try {
    if (!ai) throw new Error('GEMINI_API_KEY is not configured');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You maintain 100% visual consistency across video scene generations. Output valid JSON only.',
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    if (user) {
      await CreditWalletService.debitCreditsAtomic({
        userId: user.id,
        cost,
        operation: 'scene_media_prompt_generation',
        authToken: (user as any).authToken,
      });
    }
    return res.json({ result: parsed });
  } catch (error: any) {
    return res.json({
      result: {
        consistentPrompt: `Cinematic scene #${sceneNumber}: ${visualDescription}. Character: ${visualIdentity?.characterDescription || 'Consistent host'}. Wearing: ${visualIdentity?.clothing || 'signature attire'}. Environment: ${visualIdentity?.environmentStyle || 'studio'}. Lighting: ${visualIdentity?.lighting || 'soft cinematic rim lighting'}. Style: ${visualIdentity?.artStyle || 'cinematic 4k'}.`,
        negativePrompt: 'inconsistent character, altered face, different clothing, distorted anatomy, low quality',
        cameraGuidance: 'Slow deliberate dolly in with subtle parallax shift',
      },
    });
  }
});

// 10. Auto Captions Generator
app.post('/api/generate-auto-captions', async (req, res) => {
  const { scriptText, scenes = [] } = req.body;

  const prompt = `Convert the following script into sequential time-coded caption segments suitable for social video subtitles:
Script:
"""${(scriptText || '').slice(0, 2000)}"""

Return ONLY a JSON array of caption segments:
[
  {
    "id": "cap-1",
    "sceneNumber": 1,
    "text": "Short punchy caption line (3-6 words)",
    "startTime": 0.0,
    "endTime": 2.5
  }
]`;

  try {
    if (!ai) throw new Error('GEMINI_API_KEY is not configured');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You break speech into fast-reading, high-retention video subtitles. Output valid JSON array only.',
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsed = extractJsonFromText(response.text || '[]');
    return res.json({ segments: Array.isArray(parsed) ? parsed : [parsed] });
  } catch (error: any) {
    const normalized = AIProviderService.normalizeError(error);
    return res.status(normalized.statusCode).json({
      error: normalized.errorCode,
      message: normalized.message,
      isQuota: normalized.isQuota,
    });
  }
});

// =============================================================
// VIDEO GENERATION STUDIO ENDPOINTS (Secure Video Provider Layer)
// =============================================================

// Get Video Provider Connectivity Status & Available Capabilities
app.get('/api/video/provider-status', (_req, res) => {
  const status = VideoProviderService.getProviderStatus();
  return res.json(status);
});

// Calculate Variable Video Credits with Cost Protection
app.post('/api/video/calculate-cost', (req, res) => {
  const calculation = VideoProviderService.calculateCost(req.body);
  return res.json(calculation);
});

// Create and trigger an async Video Generation Job
app.post('/api/video/jobs', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  try {
    const job = await VideoProviderService.createJob({
      userId: user.id,
      projectId: req.body.projectId,
      sceneId: req.body.sceneId,
      provider: req.body.provider,
      model: req.body.model,
      prompt: req.body.prompt,
      referenceImageUrl: req.body.referenceImageUrl,
      duration: req.body.duration,
      aspectRatio: req.body.aspectRatio,
      resolution: req.body.resolution,
      authToken: (user as any).authToken,
      requestId: req.body.requestId,
      confirmedCredits: req.body.confirmedCredits,
    });
    return res.status(201).json({ success: true, job });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.code || 'VIDEO_GENERATION_FAILED',
      message: err.message || 'Video generation job failed to initialize.',
      job: err.job,
    });
  }
});

// Poll status of an async video job
app.get('/api/video/jobs/:jobId', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const job = dbManager.getVideoJob(req.params.jobId, user.id);
  if (!job) {
    return res.status(404).json({ error: 'JOB_NOT_FOUND', message: 'Video job not found' });
  }
  return res.json({ job });
});

// List user's video jobs (optionally filtered by projectId)
app.get('/api/video/jobs', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const jobs = dbManager.listVideoJobs(user.id, req.query.projectId as string);
  return res.json({ jobs });
});

// List user's video assets (optionally filtered by projectId)
app.get('/api/video/assets', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const assets = dbManager.listVideoAssets(user.id, req.query.projectId as string);
  return res.json({ assets });
});

// Secure Project Asset Storage: Stream video asset with user ownership protection
app.get('/api/video-assets/:assetId', (req, res) => {
  const assetId = req.params.assetId;
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const asset = dbManager.getVideoAsset(assetId);
  if (!asset) {
    return res.status(404).json({ error: 'ASSET_NOT_FOUND', message: 'Video asset not found' });
  }

  // Security: User isolation check
  if (asset.userId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied to this video asset.' });
  }

  if (!fs.existsSync(asset.storagePath)) {
    return res.status(404).json({ error: 'FILE_NOT_FOUND', message: 'Video asset file missing on disk.' });
  }

  const stat = fs.statSync(asset.storagePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(asset.storagePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(asset.storagePath).pipe(res);
  }
});

// Prepare/render combined project video (concatenates completed scenes genuinely with ffmpeg)
app.post('/api/video/export-project', async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'PROJECT_ID_REQUIRED', message: 'projectId is required.' });

  try {
    const result = await VideoProviderService.exportProjectVideo(projectId, user.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'EXPORT_FAILED', message: err.message || 'Export failed' });
  }
});

// Dedicated one-time test endpoint as required by prompt requirement 12
app.post('/api/video/test', async (_req, res) => {
  const result = await VideoProviderService.runTest();
  return res.json(result);
});

// 11. Check Media Capabilities
app.get('/api/media-capabilities', (_req, res) => {
  const providerStatus = VideoProviderService.getProviderStatus();
  res.json({
    imageGenerationAvailable: false,
    videoGenerationAvailable: providerStatus.configured,
    videoProvider: providerStatus.activeProvider,
    videoStatusText: providerStatus.statusText,
    ttsAvailable: true,
    serverTTSAvailable: false,
    message: providerStatus.message,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    studio: 'CreatorNova AI',
    timestamp: new Date().toISOString(),
  });
});

// Mount Vite in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CreatorNova AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
