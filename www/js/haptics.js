/* Capacitor haptics with a graceful no-op when the plugin is unavailable. */

const STYLES = {
  impactHeavy: ["impact", { style: "HEAVY" }],
  impactMedium: ["impact", { style: "MEDIUM" }],
  impactLight: ["impact", { style: "LIGHT" }],
  notificationSuccess: ["notification", { type: "SUCCESS" }],
};

export async function haptic(type = "impactHeavy") {
  const plugin = window.Capacitor?.Plugins?.Haptics;
  const spec = STYLES[type];
  if (!plugin || !spec) return;
  const [method, options] = spec;
  try {
    await plugin[method](options);
  } catch {
    /* Haptics are decorative; never let them break a gesture. */
  }
}
