/**
 * Vercel Speed Insights integration
 * Injects the Speed Insights script to track page performance
 */
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
injectSpeedInsights({
  debug: false, // Set to true in development if you want to see debug logs
});
