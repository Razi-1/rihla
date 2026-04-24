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

export function createJitsiMeeting(config: JitsiConfig): JitsiApi | null {
  if (typeof window.JitsiMeetExternalAPI === 'undefined') return null;

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
