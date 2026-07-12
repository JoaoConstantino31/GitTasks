GitTasks

GitTasks is a web application that integrates GitHub Milestones with Google Tasks, allowing authenticated users to create Google Tasks directly from GitHub project milestones.

The application demonstrates the integration of multiple web technologies, authentication protocols, access control mechanisms, and external REST APIs without relying on official SDKs.

Features
Authenticate users with Google OpenID Connect (OIDC).
Secure session management using HTTP Cookies.
Browse milestones from public GitHub repositories.
Create Google Tasks from GitHub milestones.
Role-Based Access Control (RBAC) with three permission levels.
Integration with the GitHub REST API and Google Tasks API.
Manual implementation of OAuth 2.0 and OpenID Connect flows using HTTP requests.
Role-Based Access Control

The application implements RBAC using Casbin with three user roles:

Free
Authenticate with Google.
Browse GitHub repositories.
View repository milestones.
Regular

Includes all Free permissions plus:

Create Google Tasks from GitHub milestones.
Tasks are added to an application-defined task list.
Premium

Includes all Regular permissions plus:

Select the destination Google Tasks list.
Full access to task creation features.

The active user role is displayed in the application's interface and all permissions are enforced through Casbin policies.

Authentication

GitTasks uses Google OpenID Connect (OIDC) for user authentication.

The authentication flow includes:

Google Authorization Endpoint
OAuth 2.0 Authorization Code Flow
Token Exchange
UserInfo Endpoint
Session management with secure cookies

No user credentials are stored by the application.

Technologies
Node.js
Express.js
JavaScript
HTML/CSS
OpenID Connect (OIDC)
OAuth 2.0
Casbin
GitHub REST API
Google Tasks API
HTTP Cookies
REST APIs
Project Architecture
User
   │
   ▼
GitTasks Web Application
   │
   ├── Google OpenID Connect
   │       │
   │       ├── Authorization
   │       ├── Token Exchange
   │       └── User Information
   │
   ├── GitHub REST API
   │       └── Repository Milestones
   │
   ├── Google Tasks API
   │       └── Task Creation
   │
   └── Casbin
           └── RBAC Policy Enforcement
Learning Outcomes

This project provided practical experience with:

OAuth 2.0
OpenID Connect (OIDC)
Role-Based Access Control (RBAC)
Casbin authorization
REST API integration
External API consumption
Session management with cookies
Authentication and authorization
Secure web application development
