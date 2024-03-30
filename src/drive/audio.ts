import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import {
  AudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer
} from "@discordjs/voice";

// Global
export let audioFiles: { id: string; name: string; }[] = [];
export let player: AudioPlayer;

export function createPlayer() {
  player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  // Hooks
  player.on('error', error => {
    throw error;
  });

  return player;
}


/**
 * Retrieves a list of audio files from the specified Google Drive folder.
 *
 * @returns {Promise<void>} 
 */
export async function listAudioFiles(): Promise<void> {
  const driveID = process.env.DRIVE_ID;
  let fullFiles: any[] = [];
  let resJson, pageToken;
  do {
    const res: any = await fetch(`https://www.googleapis.com/drive/v3/files`
      + `?q=%27${driveID}%27%20in%20parents`
      + `&key=${process.env.GOOGLE_API_KEY}`
      + (pageToken ? `&pageToken=${pageToken}` : ""),
      {
        "method": "GET"
      });
    resJson = await res.json();
    fullFiles = fullFiles.concat(resJson.files);
    pageToken = resJson.nextPageToken;
  } while (resJson.nextPageToken);

  audioFiles = fullFiles.map((i: { id: any; name: any; }) => { return { id: i.id, name: i.name } });
}

export async function updateAudioFiles() {
  console.log("[AUDIO] Update started");
  for (const audioFile of audioFiles) {
    try {
      const destination = path.resolve("./audio", audioFile.name);
      if (fs.existsSync(destination)) {
        continue;
      }

      process.stdout.write("[AUDIO] Downloading " + audioFile.name + "... ");

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${audioFile.id}?key=${process.env.GOOGLE_API_KEY}&alt=media`, {
        method: "GET"
      });

      if (!res.body) throw "ERR_NO_BODY " + audioFile.name;

      const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
      const readable = Readable.fromWeb(res.body as any);
      await finished(readable.pipe(fileStream));
      process.stdout.write("FINISHED\n");
    } catch (error) {
      process.stdout.write(`ERROR: ${error}\n`);
    }
  }
  console.log("[AUDIO] Update finished");
}