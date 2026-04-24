import * as sdk from 'matrix-js-sdk';
import { getAccessToken } from './secureStore';

let matrixClient: sdk.MatrixClient | null = null;

const HOMESERVER_URL = __DEV__
  ? 'https://192.168.1.100:8448'
  : 'https://matrix.rihla.app';

export async function initMatrixClient(
  userId: string,
  matrixAccessToken: string,
): Promise<sdk.MatrixClient> {
  if (matrixClient) {
    return matrixClient;
  }

  matrixClient = sdk.createClient({
    baseUrl: HOMESERVER_URL,
    accessToken: matrixAccessToken,
    userId: `@${userId}:localhost`,
    useAuthorizationHeader: true,
  });

  await matrixClient.startClient({ initialSyncLimit: 20 });

  return matrixClient;
}

export function getMatrixClient(): sdk.MatrixClient | null {
  return matrixClient;
}

export async function stopMatrixClient(): Promise<void> {
  if (matrixClient) {
    matrixClient.stopClient();
    matrixClient = null;
  }
}

export async function sendMessage(roomId: string, body: string): Promise<void> {
  if (!matrixClient) throw new Error('Matrix client not initialized');
  await matrixClient.sendTextMessage(roomId, body);
}

export function onRoomMessage(
  callback: (event: sdk.MatrixEvent, room: sdk.Room | undefined) => void,
): () => void {
  if (!matrixClient) throw new Error('Matrix client not initialized');

  const handler = (event: sdk.MatrixEvent, room: sdk.Room | undefined) => {
    if (event.getType() === 'm.room.message') {
      callback(event, room);
    }
  };

  matrixClient.on(sdk.RoomEvent.Timeline, handler as any);
  return () => {
    matrixClient?.removeListener(sdk.RoomEvent.Timeline, handler as any);
  };
}
