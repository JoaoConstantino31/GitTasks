import dotenv from "dotenv";
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import expressSession from 'express-session';
import passport from 'passport';
import { newEnforcer } from 'casbin';

import auth from './routes/auth.js';
import github from './routes/github.js';
import tasks from './routes/tasks.js';
import user from './routes/user.js';

import { ensureAuth } from './util/ensureAuth.js';
import { requirePermission } from './util/permissions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8081;

// Initialize Casbin enforcer
const enforcer = await newEnforcer(
  path.join(__dirname, 'casbin/model.conf'),
  path.join(__dirname, 'casbin/policy.csv')
);

// Middleware setup
app.use(expressSession({ 
  secret: process.env.SESSION_SECRET || 'SegInf 2026', 
  resave: true, 
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));

// Make enforcer available to routes
app.locals.enforcer = enforcer;

app.get("/login", auth.getLogin);
app.get('/auth/callback',auth.getAuthCallback);
app.get('/auth/github/login', auth.getGitHubLogin);
app.get('/auth/github/callback', auth.getGitHubCallback);
app.post("/logout", auth.postLogout);
app.post("/login", auth.postLogin);

// Needs authentication
app.get('/', ensureAuth, (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// GitHub ensureAuth + permission
app.get('/api/user', ensureAuth, user.getUserInfo);
app.get('/api/repos', ensureAuth, requirePermission('milestones','view'), github.getUserRepositories);

// Tasks ensureAuth + permission create
app.get('/api/milestones/:owner/:repo', ensureAuth, requirePermission('milestones','view'), github.getRepositoryMilestones);
app.get('/api/task-lists', ensureAuth, requirePermission('tasks','create'), tasks.getTaskLists);
app.post('/api/tasks', ensureAuth, requirePermission('tasks','create'), tasks.createTask);

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.resolve(__dirname, '../public/404.html'));
});

// Start the server
app.listen(PORT, () => {
            console.log(`\n✓ GitTasks server running on http://localhost:${PORT}`);
            console.log(`✓ Login page: http://localhost:${PORT}/login`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        });
