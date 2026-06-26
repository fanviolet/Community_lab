/**
 * Feature Flags Configuration
 * 
 * Use these flags to conditionally enable/disable features across the application.
 * Features are enabled by default unless explicitly disabled via environment variables.
 * 
 * Environment variable overrides (set to "false" to disable):
 * - NEXT_PUBLIC_FEATURE_AI_WORKFLOW_GENERATION
 * - NEXT_PUBLIC_FEATURE_AI_REPORT_GENERATION
 */

export const FEATURES = {
  AI_WORKFLOW_GENERATION: process.env.NEXT_PUBLIC_FEATURE_AI_WORKFLOW_GENERATION !== "false",
  AI_REPORT_GENERATION: process.env.NEXT_PUBLIC_FEATURE_AI_REPORT_GENERATION !== "false",
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  const enabled = FEATURES[feature];
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FeatureFlag] ${feature}: ${enabled ? 'ENABLED' : 'DISABLED'}`, {
      feature,
      enabled,
      envVar: feature === 'AI_WORKFLOW_GENERATION' 
        ? process.env.NEXT_PUBLIC_FEATURE_AI_WORKFLOW_GENERATION 
        : process.env.NEXT_PUBLIC_FEATURE_AI_REPORT_GENERATION,
      defaultValue: false,
    });
  }
  
  return enabled;
}

/**
 * Get disabled feature message
 */
export function getDisabledFeatureMessage(feature: FeatureFlag): string {
  return "This feature is temporarily disabled.";
}

/**
 * Get detailed feature status for debugging
 */
export function getFeatureStatus(feature: FeatureFlag): {
  enabled: boolean;
  reason: string;
  envVar?: string;
} {
  const enabled = FEATURES[feature];
  const envVar = feature === 'AI_WORKFLOW_GENERATION'
    ? process.env.NEXT_PUBLIC_FEATURE_AI_WORKFLOW_GENERATION
    : process.env.NEXT_PUBLIC_FEATURE_AI_REPORT_GENERATION;
  
  let reason: string;
  if (enabled) {
    reason = envVar === "false" 
      ? "Explicitly enabled despite env var" 
      : "Enabled by default (no env var or env var !== 'false')";
  } else {
    reason = envVar === "false"
      ? "Explicitly disabled via environment variable"
      : "Unexpected: should be enabled by default";
  }
  
  return {
    enabled,
    reason,
    envVar,
  };
}
