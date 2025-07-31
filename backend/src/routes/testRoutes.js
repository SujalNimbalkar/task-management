const express = require('express');
const router = express.Router();
const { testMonthlyTaskCreation } = require('../jobs/recurringTasks');

// Test endpoint to manually trigger monthly task creation
router.post('/trigger-monthly', async (req, res) => {
  try {
    console.log('[TEST] Manual trigger requested');
    await testMonthlyTaskCreation();
    res.json({ 
      success: true, 
      message: 'Monthly task creation triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEST] Error in manual trigger:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test endpoint to check current time and trigger conditions
router.get('/trigger-status', (req, res) => {
  const dateFnsTz = require('date-fns-tz');
  const utcToZonedTime = dateFnsTz.toZonedTime;
  const IST_TIMEZONE = "Asia/Kolkata";

  const now = new Date();
  const nowIST = utcToZonedTime(now, IST_TIMEZONE);
  const istDay = nowIST.getDate();
  const istHour = nowIST.getHours();
  const istMinute = nowIST.getMinutes();

  const status = {
    currentTime: {
      utc: now.toISOString(),
      ist: nowIST.toLocaleString("en-IN", { timeZone: IST_TIMEZONE }),
      day: istDay,
      hour: istHour,
      minute: istMinute
    },
    triggerConditions: {
      is31st: istDay === 31,
      is17Hour: istHour === 17,
      isExactTime: istHour === 17 && istMinute === 0,
      isTimeWindow: istHour === 17 && istMinute >= 0 && istMinute < 5
    },
    nextTrigger: {
      next31st: new Date(now.getFullYear(), now.getMonth() + 1, 31).toISOString(),
      next17Hour: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0).toISOString()
    }
  };

  res.json(status);
});

module.exports = router; 