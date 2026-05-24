export type RtcIceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export function parseIceServers(): RtcIceServer[] {
  const servers: RtcIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrls = String(process.env.TURN_URLS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (turnUrls.length > 0) {
    const turnServer: RtcIceServer = { urls: turnUrls };

    if (process.env.TURN_USERNAME) {
      turnServer.username = process.env.TURN_USERNAME;
    }

    if (process.env.TURN_CREDENTIAL) {
      turnServer.credential = process.env.TURN_CREDENTIAL;
    }

    servers.push(turnServer);
  }

  return servers;
}
