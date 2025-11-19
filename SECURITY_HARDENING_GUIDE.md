# 🔒 Security Hardening Guide
## Justice Ultimate Automobiles - Authentication Security Implementation

This document provides step-by-step instructions for implementing defense-in-depth security measures for the authentication system.

---

## 📋 Table of Contents
1. [Supabase Dashboard Configuration](#supabase-dashboard-configuration)
2. [Cloudflare Setup](#cloudflare-setup)
3. [MFA Implementation](#mfa-implementation)
4. [Key Rotation](#key-rotation)
5. [Monitoring & Logging](#monitoring--logging)
6. [Testing & Validation](#testing--validation)

---

## 🎛️ Supabase Dashboard Configuration

### A. Enable CAPTCHA Protection (Turnstile)

**Status: ✅ COMPLETED** - Turnstile is already integrated in the frontend

1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Scroll to **Bot & Abuse Protection**
3. Toggle **Enable CAPTCHA protection** to ON
4. Select **Cloudflare Turnstile** as the provider
5. Enter your **Turnstile Secret Key**: `[Your Cloudflare Secret Key]`
   - Get this from: https://dash.cloudflare.com/
   - Site Key (already in frontend): `0x4AAAAAACB3OcIZy30ifRMd`
6. Click **Save**

📖 Reference: https://supabase.com/docs/guides/auth/auth-captcha

---

### B. Enable Leaked Password Protection

**Priority: 🔴 CRITICAL**

1. Go to **Authentication** → **Providers** → **Email**
2. Find **Password Requirements** section
3. Toggle **Enable HaveIBeenPwned integration** to ON
4. This will automatically reject passwords found in known data breaches
5. Click **Save**

📖 Reference: https://supabase.com/docs/guides/auth/password-security

**What this does:**
- Checks passwords against HaveIBeenPwned database (800M+ leaked passwords)
- Rejects passwords that have been compromised
- Users will see: "This password has been found in a data breach"

---

### C. Configure Password Policy

**Priority: 🔴 CRITICAL**

1. Go to **Authentication** → **Providers** → **Email**
2. Set **Minimum password length**: `12` characters (recommended)
3. Enable **Require uppercase letters**: ✅
4. Enable **Require lowercase letters**: ✅
5. Enable **Require numbers**: ✅
6. Enable **Require special characters**: ✅
7. Click **Save**

**Frontend Status: ✅ COMPLETED**
- Password strength meter implemented
- Real-time validation with visual feedback
- Prevents submission of weak passwords

---

### D. Enable Email Confirmation

**Priority: 🔴 CRITICAL**

1. Go to **Authentication** → **Settings**
2. Find **Email Confirmation** section
3. Toggle **Enable email confirmations** to ON
4. Set **Confirmation expiry**: `24 hours` (recommended)
5. Customize email template if desired
6. Click **Save**

**Impact:**
- Users must verify email before account activation
- Prevents fake account creation
- Reduces spam signups

---

### E. Configure Session Management

**Priority: 🟡 IMPORTANT**

1. Go to **Authentication** → **Settings**
2. Find **JWT Settings**
3. Set **JWT expiry**: `900` seconds (15 minutes) - recommended for high security
4. Set **Refresh token lifetime**: `2592000` seconds (30 days)
5. Enable **Refresh token rotation**: ✅
6. Click **Save**

**What this does:**
- Short-lived access tokens reduce exposure window
- Refresh tokens allow seamless re-authentication
- Token rotation prevents token reuse attacks

---

### F. Enable Multi-Factor Authentication (MFA)

**Priority: 🟡 IMPORTANT**

1. Go to **Authentication** → **Multi-Factor Authentication**
2. Enable **TOTP (Time-based One-Time Password)**: ✅
3. Enable **Phone-based MFA** (optional): ✅ (requires SMS provider)
4. Set **MFA Enforcement**:
   - **Optional**: Users can enable MFA themselves
   - **Required for admins**: Force MFA for admin users (recommended)
   - **Required for all**: Force MFA for all users (highest security)
5. Click **Save**

📖 Reference: https://supabase.com/docs/guides/auth/auth-mfa

**Frontend Implementation Needed:**
- MFA enrollment UI (QR code for TOTP)
- MFA verification during login
- MFA management in user settings

---

### G. Enable Audit Logging

**Priority: 🟡 IMPORTANT**

1. Go to **Authentication** → **Logs**
2. Enable **Auth Logs**: ✅
3. Set log retention: `30 days` (or longer for compliance)
4. Optional: Configure log forwarding to external service
   - Logflare (built-in integration)
   - ELK Stack
   - Splunk
5. Click **Save**

**What gets logged:**
- All sign-ups, sign-ins, sign-outs
- Failed login attempts
- Password resets
- MFA enrollment/verification
- Token refreshes

---

## ☁️ Cloudflare Setup

### A. Enable Turnstile (CAPTCHA)

**Status: ✅ COMPLETED**

Site is already configured with:
- **Site Key**: `0x4AAAAAACB3OcIZy30ifRMd`
- **Mode**: Managed (visible widget)
- **Integration**: Frontend + Supabase backend verification

---

### B. Configure WAF Rules (Rate Limiting)

**Priority: 🔴 CRITICAL**

1. Log in to Cloudflare Dashboard
2. Select your domain
3. Go to **Security** → **WAF** → **Rate Limiting Rules**
4. Click **Create Rule**

**Recommended Rules:**

#### Rule 1: Auth Endpoint Rate Limit
```
Rule Name: Auth Signup/Login Rate Limit
When incoming requests match:
  - URI Path contains "/auth/v1/signup" OR
  - URI Path contains "/auth/v1/token" OR
  - URI Path contains "/auth/v1/recover"
Then:
  - Rate: 10 requests per 1 minute per IP
  - Action: Block
  - Duration: 10 minutes
```

#### Rule 2: Password Reset Rate Limit
```
Rule Name: Password Reset Rate Limit
When incoming requests match:
  - URI Path contains "/auth/v1/recover"
Then:
  - Rate: 3 requests per 10 minutes per IP
  - Action: Challenge (CAPTCHA)
  - Duration: 30 minutes
```

#### Rule 3: Failed Login Blocking
```
Rule Name: Failed Login Blocking
When incoming requests match:
  - URI Path contains "/auth/v1/token"
  - HTTP Response Code equals 401
Then:
  - Rate: 5 requests per 5 minutes per IP
  - Action: Block
  - Duration: 1 hour
```

5. Click **Deploy** for each rule

📖 Reference: https://developers.cloudflare.com/waf/rate-limiting-rules/

---

### C. Enable Bot Fight Mode

**Priority: 🟡 IMPORTANT**

1. Go to **Security** → **Bots**
2. Toggle **Bot Fight Mode** to ON
3. Set to **Definitely Automated** blocking
4. Enable **Super Bot Fight Mode** (if available on your plan)
5. Click **Save**

---

### D. Enable OWASP Rules

**Priority: 🟡 IMPORTANT**

1. Go to **Security** → **WAF** → **Managed Rules**
2. Enable **Cloudflare OWASP Core Ruleset**: ✅
3. Set sensitivity: **Medium** (recommended)
4. Click **Deploy**

**Protects against:**
- SQL Injection
- XSS attacks
- Command injection
- Path traversal
- Remote file inclusion

---

## 🔐 MFA Implementation

### Frontend Components Needed

Create these components for MFA enrollment and verification:

#### 1. MFA Enrollment Component
```typescript
// src/components/MFAEnrollment.tsx
// - Display QR code for TOTP setup
// - Allow user to scan with authenticator app
// - Verify code to complete enrollment
// - Provide backup codes
```

#### 2. MFA Verification Component
```typescript
// src/components/MFAVerification.tsx
// - Prompt for TOTP code during login
// - Verify code with Supabase
// - Handle backup code entry
// - Remember device option (optional)
```

#### 3. MFA Management Page
```typescript
// src/pages/MFASettings.tsx
// - View MFA status
// - Enable/disable MFA
// - Regenerate backup codes
// - View trusted devices
```

### Supabase MFA Implementation

```typescript
// Enroll user in MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
});

// Generate QR code from data.totp.qr_code

// Verify enrollment
await supabase.auth.mfa.challengeAndVerify({
  factorId: data.id,
  code: userEnteredCode
});

// During login - verify MFA
const { data: { factors } } = await supabase.auth.mfa.listFactors();
if (factors.length > 0) {
  const { data: challenge } = await supabase.auth.mfa.challenge({
    factorId: factors[0].id
  });
  
  // Prompt user for code, then verify
  await supabase.auth.mfa.verify({
    factorId: factors[0].id,
    challengeId: challenge.id,
    code: userCode
  });
}
```

📖 Reference: https://supabase.com/docs/guides/auth/auth-mfa

---

## 🔑 Key Rotation

### A. Create Key Rotation Schedule

**Recommended Schedule:**
- **Service Role Key**: Every 90 days
- **Anon Key**: Every 90 days
- **JWT Secret**: Every 180 days
- **Cloudflare Secret**: Every 180 days
- **Pepper (if implemented)**: Every 365 days

### B. Service Role Key Rotation Script

```bash
#!/bin/bash
# rotate-service-key.sh

echo "🔄 Starting Service Role Key Rotation..."

# 1. Generate new key in Supabase Dashboard
echo "1. Go to Settings → API → Generate new service_role key"
echo "2. Copy the new key"
read -p "Enter new service_role key: " NEW_KEY

# 2. Update environment variables
export OLD_KEY=$SUPABASE_SERVICE_ROLE_KEY
export SUPABASE_SERVICE_ROLE_KEY=$NEW_KEY

# 3. Update all edge functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$NEW_KEY

# 4. Verify new key works
echo "Testing new key..."
curl -X GET "https://ccsfhblxkmyqdqqcgitt.supabase.co/rest/v1/profiles?select=*&limit=1" \
  -H "apikey: $NEW_KEY" \
  -H "Authorization: Bearer $NEW_KEY"

# 5. Monitor for errors (24 hour grace period)
echo "✅ New key deployed. Monitor for 24 hours before revoking old key."
echo "Old key will remain valid until you revoke it in the dashboard."

# 6. After 24 hours, revoke old key in dashboard
read -p "Press enter after 24 hours to revoke old key..."
echo "Go to Settings → API → Revoke old key"
```

📖 Reference: https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets

---

### C. JWT Secret Rotation

**⚠️ WARNING: Rotating JWT secret invalidates ALL user sessions**

1. Schedule maintenance window (low traffic period)
2. Notify users of temporary logout
3. Go to **Settings** → **API** → **JWT Settings**
4. Click **Generate new JWT secret**
5. Click **Apply** - this will:
   - Generate new secret
   - Invalidate all existing tokens
   - Force all users to re-login
6. Update your application code if you verify JWTs manually
7. Monitor error logs for issues

**Best Practice:** Rotate during scheduled maintenance, not emergency.

---

## 📊 Monitoring & Logging

### A. Set Up Monitoring Dashboard

**Tools Recommended:**
1. **Supabase Dashboard** (built-in)
   - Auth logs
   - Database performance
   - API usage

2. **Logflare** (integrated with Supabase)
   - Real-time log streaming
   - Advanced filtering
   - Alerting

3. **Sentry** (for error tracking)
   - Frontend error monitoring
   - Backend exception tracking
   - Performance monitoring

### B. Critical Alerts to Configure

1. **Failed Login Spike**
   - Threshold: >50 failed logins in 5 minutes
   - Action: Alert security team + enable additional CAPTCHA

2. **Mass Account Creation**
   - Threshold: >20 signups in 1 minute from same IP
   - Action: Temporary IP block + review logs

3. **Password Reset Abuse**
   - Threshold: >10 reset requests for same email in 1 hour
   - Action: Rate limit + notify security team

4. **MFA Bypass Attempts**
   - Threshold: >5 failed MFA codes
   - Action: Lock account + require support contact

5. **API Key Exposure**
   - Monitor: GitHub, PasteBin, public repos
   - Action: Immediate key rotation + security review

### C. Log Retention Policy

**Recommendation:**
- **Auth logs**: 90 days (minimum)
- **Audit logs**: 365 days (compliance)
- **Error logs**: 30 days
- **Access logs**: 30 days

**Backup:**
- Export logs monthly to secure S3 bucket
- Encrypt backups with KMS
- Set 7-year retention for compliance

---

## ✅ Testing & Validation

### A. Security Test Checklist

#### Authentication Tests

- [ ] **Signup with weak password** → Should be rejected
- [ ] **Signup with leaked password** → Should be rejected with specific message
- [ ] **Signup without CAPTCHA** → Should be rejected
- [ ] **Login with correct credentials + CAPTCHA** → Should succeed
- [ ] **Login without CAPTCHA** → Should be rejected
- [ ] **5 failed login attempts** → Account should be temporarily locked
- [ ] **Password reset spam** → Should be rate limited
- [ ] **Email confirmation required** → User cannot access protected routes until confirmed

#### MFA Tests (when implemented)

- [ ] **Enroll in TOTP** → QR code displayed, backup codes provided
- [ ] **Login with MFA** → Prompt for code, verify, grant access
- [ ] **Login with wrong MFA code** → Deny access, allow retry
- [ ] **5 wrong MFA codes** → Lock account
- [ ] **Backup code usage** → Should work once and be invalidated

#### Session Tests

- [ ] **Access token expiry** → After 15 minutes, should auto-refresh
- [ ] **Refresh token rotation** → New refresh token issued with each refresh
- [ ] **Manual logout** → All tokens invalidated
- [ ] **Session on multiple devices** → Each device has independent session

#### Rate Limiting Tests

- [ ] **10+ signup requests in 1 minute** → Should be blocked by Cloudflare
- [ ] **20+ failed logins** → IP should be temporarily blocked
- [ ] **Rapid password reset requests** → Should trigger CAPTCHA challenge

### B. Penetration Testing

**Schedule:** Every 6 months

**Test Scenarios:**
1. **Brute Force Attack**
   - Attempt to brute force login
   - Verify rate limiting blocks attack
   - Verify CAPTCHA triggers

2. **Password Spray Attack**
   - Test common passwords across multiple accounts
   - Verify leaked password protection blocks known passwords

3. **Session Hijacking**
   - Attempt to reuse expired tokens
   - Attempt to use tokens across different IPs
   - Verify token rotation

4. **SQL Injection**
   - Test all input fields
   - Verify Supabase RLS policies
   - Verify no raw SQL in edge functions

5. **XSS Attacks**
   - Test all user-generated content fields
   - Verify input sanitization
   - Check for DOM-based XSS

### C. Compliance Validation

#### GDPR Compliance
- [ ] User can export all their data
- [ ] User can delete their account and all data
- [ ] Cookie consent implemented
- [ ] Privacy policy accessible
- [ ] Data retention policy documented

#### Password Storage Compliance
- [ ] Passwords hashed with bcrypt (min cost 10)
- [ ] No plaintext passwords stored anywhere
- [ ] No passwords in logs
- [ ] Pepper implemented (if chosen)

---

## 🎯 Implementation Priority

### Phase 1: Critical (0-7 days)
1. ✅ Turnstile CAPTCHA (COMPLETED)
2. ✅ Password strength validation (COMPLETED)
3. 🔴 Enable leaked password protection in Supabase
4. 🔴 Configure Cloudflare rate limiting rules
5. 🔴 Enable email confirmation
6. 🔴 Configure session management

### Phase 2: Important (7-14 days)
1. 🟡 Implement MFA enrollment UI
2. 🟡 Implement MFA verification flow
3. 🟡 Set up monitoring and alerts
4. 🟡 Create key rotation scripts
5. 🟡 Enable audit logging

### Phase 3: Enhanced (14-30 days)
1. 🟢 Implement server-side pepper (optional)
2. 🟢 Add advanced MFA options (SMS, phone)
3. 🟢 Penetration testing
4. 🟢 Security audit
5. 🟢 Documentation and training

---

## 📞 Emergency Response

### Security Incident Response Plan

#### 1. Suspected Breach
1. **Immediate Actions:**
   - Rotate all API keys immediately
   - Force logout all users (rotate JWT secret)
   - Enable additional rate limiting
   - Review recent auth logs

2. **Investigation:**
   - Identify compromised accounts
   - Check for data exfiltration
   - Review CloudFlare logs
   - Check for unauthorized database access

3. **Notification:**
   - Notify affected users within 72 hours (GDPR)
   - Document incident
   - File security report

#### 2. Key Exposure
1. Immediately rotate exposed keys
2. Revoke old keys
3. Review access logs for unauthorized usage
4. Update all systems with new keys
5. Investigate how key was exposed
6. Implement controls to prevent recurrence

#### 3. Mass Account Creation
1. Enable strict CAPTCHA mode
2. Temporarily block suspicious IP ranges
3. Review and delete fake accounts
4. Strengthen signup requirements temporarily
5. Investigate bot patterns

---

## 📚 Additional Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Supabase Security Best Practices**: https://supabase.com/docs/guides/platform/going-into-prod
- **OWASP Authentication Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **NIST Password Guidelines**: https://pages.nist.gov/800-63-3/sp800-63b.html
- **Cloudflare WAF**: https://developers.cloudflare.com/waf/
- **Cloudflare Turnstile**: https://developers.cloudflare.com/turnstile/

---

## ✍️ Document Version

- **Version**: 1.0
- **Last Updated**: 2025-01-19
- **Next Review**: 2025-04-19

---

**Prepared for**: Justice Ultimate Automobiles  
**System**: Authentication Security Hardening  
**Status**: Implementation In Progress
