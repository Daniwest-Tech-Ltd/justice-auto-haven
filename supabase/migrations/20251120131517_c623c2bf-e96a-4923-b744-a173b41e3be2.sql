-- Insert comprehensive DDoS Protection Playbooks
INSERT INTO security_playbooks (name, description, enabled, trigger_conditions, actions) VALUES
('DDoS Layer 7 HTTP Flood Protection', 'Automated response to HTTP flood attacks targeting application layer', true, 
 '{"type": "event_type", "value": "ddos_http_flood", "threshold": 1000}'::jsonb,
 '{"type": "ddos_mitigation", "steps": ["Enable rate limiting", "Activate CDN protection", "Block suspicious IPs", "Enable CAPTCHA challenges", "Alert security team"]}'::jsonb),

('DDoS SYN Flood Mitigation', 'Protect against TCP SYN flood attacks', true,
 '{"type": "event_type", "value": "ddos_syn_flood", "threshold": 500}'::jsonb,
 '{"type": "ddos_mitigation", "steps": ["Enable SYN cookies", "Increase backlog queue", "Block source IPs", "Enable connection tracking", "Notify network team"]}'::jsonb),

('DDoS UDP Amplification Defense', 'Mitigate UDP-based amplification attacks', true,
 '{"type": "event_type", "value": "ddos_udp_amplification", "threshold": 100}'::jsonb,
 '{"type": "ddos_mitigation", "steps": ["Block UDP source ports", "Enable anti-spoofing filters", "Rate limit UDP traffic", "Blackhole attack traffic", "Alert ISP"]}'::jsonb),

('DDoS Slowloris Attack Protection', 'Defend against slow HTTP attacks', true,
 '{"type": "event_type", "value": "ddos_slowloris", "threshold": 50}'::jsonb,
 '{"type": "ddos_mitigation", "steps": ["Reduce connection timeout", "Limit concurrent connections per IP", "Enable request header timeout", "Block slow clients", "Log attack patterns"]}'::jsonb),

('DDoS DNS Amplification Defense', 'Protect against DNS amplification DDoS', true,
 '{"type": "event_type", "value": "ddos_dns_amplification", "threshold": 200}'::jsonb,
 '{"type": "ddos_mitigation", "steps": ["Block recursive DNS queries", "Rate limit DNS responses", "Enable response rate limiting", "Filter spoofed packets", "Coordinate with DNS providers"]}'::jsonb),

('Brute Force Attack Blocker', 'Automatically block brute force login attempts', true,
 '{"type": "failed_logins", "threshold": 5, "timeframe": "5min"}'::jsonb,
 '{"type": "block_ip", "steps": ["Identify attacker IP", "Add to blocked_ips table", "Terminate active sessions", "Enable 2FA requirement", "Send alert to admins"]}'::jsonb),

('SQL Injection Attack Response', 'Respond to SQL injection attempts', true,
 '{"type": "event_type", "value": "sql_injection_attempt"}'::jsonb,
 '{"type": "security_lockdown", "steps": ["Log attack details", "Block attacker IP", "Enable WAF rules", "Audit database queries", "Create incident report"]}'::jsonb),

('XSS Attack Mitigation', 'Defend against cross-site scripting attacks', true,
 '{"type": "event_type", "value": "xss_attempt"}'::jsonb,
 '{"type": "security_response", "steps": ["Sanitize input", "Enable CSP headers", "Block malicious requests", "Log attack vectors", "Update security filters"]}'::jsonb),

('Ransomware Detection Response', 'Automated response to ransomware indicators', true,
 '{"type": "event_type", "value": "ransomware_detected", "severity": "critical"}'::jsonb,
 '{"type": "critical_response", "steps": ["Isolate affected systems", "Snapshot current state", "Disable network access", "Alert IR team", "Initiate backup recovery"]}'::jsonb),

('Malware Propagation Containment', 'Contain detected malware spread', true,
 '{"type": "event_type", "value": "malware_propagation"}'::jsonb,
 '{"type": "containment", "steps": ["Identify infected hosts", "Quarantine systems", "Block lateral movement", "Scan all endpoints", "Deploy patches"]}'::jsonb),

('Phishing Attack Response', 'Respond to detected phishing attempts', true,
 '{"type": "event_type", "value": "phishing_detected"}'::jsonb,
 '{"type": "user_protection", "steps": ["Block phishing URLs", "Quarantine emails", "Alert affected users", "Update email filters", "Report to authorities"]}'::jsonb),

('Insider Threat Detection', 'Monitor and respond to insider threats', true,
 '{"type": "event_type", "value": "suspicious_activity", "user_behavior": "anomalous"}'::jsonb,
 '{"type": "investigation", "steps": ["Log user activities", "Review access patterns", "Alert HR and security", "Restrict privileges", "Initiate investigation"]}'::jsonb),

('Zero-Day Exploit Response', 'Respond to zero-day vulnerability exploitation', true,
 '{"type": "event_type", "value": "zero_day_exploit"}'::jsonb,
 '{"type": "emergency_response", "steps": ["Activate incident response", "Isolate vulnerable systems", "Deploy temporary patches", "Monitor exploit attempts", "Coordinate with vendors"]}'::jsonb),

('Advanced Persistent Threat (APT) Detection', 'Respond to APT indicators', true,
 '{"type": "event_type", "value": "apt_detected", "confidence": "high"}'::jsonb,
 '{"type": "apt_response", "steps": ["Preserve forensic evidence", "Map attack infrastructure", "Identify compromised assets", "Deploy honeypots", "Engage threat intelligence"]}'::jsonb),

('Data Exfiltration Prevention', 'Stop unauthorized data transfers', true,
 '{"type": "event_type", "value": "data_exfiltration_attempt"}'::jsonb,
 '{"type": "data_protection", "steps": ["Block outbound transfer", "Identify data accessed", "Revoke access credentials", "Audit data access logs", "Create incident report"]}'::jsonb);
