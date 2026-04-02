import webPush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ellaspantry.co.uk";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:hello@${new URL(VAPID_SUBJECT).hostname}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export { webPush };

export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}
