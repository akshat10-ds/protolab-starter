import { eveChannel } from "eve/channels/eve";
import { httpBasic, localDev, vercelOidc } from "eve/channels/auth";

// Production auth for the agent's HTTP surface. Without this, eve refuses every
// session route in production with `eve_production_auth_not_configured`.
//
// The walk is ordered; the first entry that authenticates wins:
//
//   vercelOidc  the deployment's OWN runtime — this is what lets the monthly
//               cron and any subagent call in. Never remove it.
//   localDev    `eve dev` on a laptop. Returns null in production.
//   httpBasic   human-triggered runs (`eve invoke`). Only registered when both
//               env vars are set, so a missing secret can never silently
//               degrade into an open endpoint.
//
// Vercel Deployment Protection already sits in front of all of this. That is a
// second gate, not a substitute: if it is ever turned off, this policy is what
// stops a stranger from spending model tokens.
const user = process.env.EVE_API_USER;
const password = process.env.EVE_API_PASSWORD;

export default eveChannel({
  auth: [
    vercelOidc(),
    localDev(),
    ...(user && password ? [httpBasic({ username: user, password })] : []),
  ],
});
