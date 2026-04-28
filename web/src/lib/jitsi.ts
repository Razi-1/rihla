interface JitsiConfig {
  roomName: string;
  parentNode: HTMLElement;
  displayName: string;
  email: string;
  jwt?: string;
  onReadyToClose?: () => void;
}

interface JitsiApi {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

const JITSI_DOMAIN = 'localhost:8443';
const JITSI_SCRIPT_URL = `https://${JITSI_DOMAIN}/external_api.js`;

let scriptLoadPromise: Promise<boolean> | null = null;

function loadJitsiScript(): Promise<boolean> {
  if (typeof window.JitsiMeetExternalAPI !== 'undefined') return Promise.resolve(true);
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${JITSI_SCRIPT_URL}"]`);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.src = JITSI_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptLoadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export async function createJitsiMeeting(config: JitsiConfig): Promise<JitsiApi | null> {
  const loaded = await loadJitsiScript();
  if (!loaded || typeof window.JitsiMeetExternalAPI === 'undefined') return null;

  const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
    roomName: config.roomName,
    parentNode: config.parentNode,
    width: '100%',
    height: '100%',
    jwt: config.jwt,
    userInfo: {
      displayName: config.displayName,
      email: config.email,
    },
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: false,
      prejoinPageEnabled: false,
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'desktop', 'chat',
        'raisehand', 'tileview', 'hangup',
      ],
      SHOW_JITSI_WATERMARK: false,
    },
  });

  if (config.onReadyToClose) {
    api.on('readyToClose', config.onReadyToClose);
  }

  return api;
}
