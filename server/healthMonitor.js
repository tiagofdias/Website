const fetch = require('node-fetch');

let lastPingTime = Date.now();
let isSystemHealthy = true;
let checkInterval = null;

// EmailJS configuration (same as Contact form)
const EMAILJS_SERVICE_ID = 'service_3lf1uj8';
const EMAILJS_TEMPLATE_ID = 'template_isj4brk';
const EMAILJS_PUBLIC_KEY = 'biAIzvFjlZVpRXOvf';
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

// Update last ping time
function updatePing() {
  lastPingTime = Date.now();
  if (!isSystemHealthy) {
    isSystemHealthy = true;
    console.log('✅ System health restored');
  }
}

// Check health status
function checkHealth() {
  const now = Date.now();
  const timeSinceLastPing = now - lastPingTime;
  const fifteenMinutes = 15 * 60 * 1000;

  if (timeSinceLastPing > fifteenMinutes && isSystemHealthy) {
    isSystemHealthy = false;
    sendAlertEmail(timeSinceLastPing);
  }

  return {
    healthy: isSystemHealthy,
    lastPing: new Date(lastPingTime),
    timeSinceLastPing: Math.floor(timeSinceLastPing / 1000), // in seconds
  };
}

// Send alert email using EmailJS (same as Contact form)
async function sendAlertEmail(downtime) {
  const downtimeMinutes = Math.floor(downtime / 60000);
  const adminEmail = process.env.ADMIN_EMAIL || 'tiagodias.cl@gmail.com';
  
  const emailData = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: {
      from_name: 'Portfolio Health Monitor',
      to_name: 'Tiago Dias',
      from_email: 'noreply@portfolio.com',
      to_email: adminEmail,
      message: `⚠️ SYSTEM HEALTH ALERT\n\nYour portfolio website has not received a health ping in over 15 minutes.\n\nDowntime: ${downtimeMinutes} minutes\nLast Ping: ${new Date(lastPingTime).toLocaleString()}\n\nPlease check your server and application status immediately.`
    }
  };

  try {
    const response = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log('🚨 Alert email sent to admin via EmailJS');
    } else {
      const errorText = await response.text();
      console.error('Failed to send alert email:', errorText);
    }
  } catch (error) {
    console.error('Failed to send alert email:', error);
  }
}

// Start monitoring
function startMonitoring() {
  if (checkInterval) return;
  
  // Check every 5 minutes
  checkInterval = setInterval(checkHealth, 5 * 60 * 1000);
  console.log('🏥 Health monitoring started');
}

// Stop monitoring
function stopMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('🏥 Health monitoring stopped');
  }
}

module.exports = {
  updatePing,
  checkHealth,
  startMonitoring,
  stopMonitoring
};
