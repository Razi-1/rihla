import * as sdk from 'matrix-js-sdk';
import { MsgType } from 'matrix-js-sdk/lib/@types/event';

let client: sdk.MatrixClient | null = null;

export function getMatrixClient(): sdk.MatrixClient | null {
  return client;
}

export async function initMatrix(
  homeserverUrl: string,
  accessToken: string,
  userId: string,
): Promise<sdk.MatrixClient> {
  client = sdk.createClient({
    baseUrl: homeserverUrl,
    accessToken,
    userId,
  });

  await client.startClient({ initialSyncLimit: 20 });
  return client;
}

export function stopMatrix(): void {
  if (client) {
    client.stopClient();
    client = null;
  }
}

export async function sendTextMessage(roomId: string, body: string): Promise<void> {
  if (!client) throw new Error('Matrix client not initialized');
  await client.sendTextMessage(roomId, body);
}

export async function sendFileMessage(roomId: string, file: File): Promise<void> {
  if (!client) throw new Error('Matrix client not initialized');
  const upload = await client.uploadContent(file, { name: file.name });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).sendEvent(roomId, sdk.EventType.RoomMessage, {
    msgtype: file.type.startsWith('image/') ? MsgType.Image : MsgType.File,
    body: file.name,
    url: upload.content_uri,
    info: { mimetype: file.type, size: file.size },
  });
}

export function onRoomTimeline(
  callback: (event: sdk.MatrixEvent, room: sdk.Room | undefined) => void,
): () => void {
  if (!client) return () => {};
  const handler = (event: sdk.MatrixEvent, room: sdk.Room | undefined) => {
    if (event.getType() === 'm.room.message') {
      callback(event, room);
    }
  };
  client.on(sdk.RoomEvent.Timeline, handler);
  return () => {
    client?.off(sdk.RoomEvent.Timeline, handler);
  };
}
