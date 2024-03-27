import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { audioFiles } from "..";
import {
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";


export const data = new SlashCommandBuilder()
  .setName("update")
  .setDescription("Aggiorna la cache locale di audio dal Drive.");

export async function execute(interaction: CommandInteraction) {
  for (const audioFile of audioFiles) {
    try {
      const destination = path.resolve("./audio", audioFile.name);
      if (fs.existsSync(destination)) {
        continue;
      }

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${audioFile.id}?key=${process.env.GOOGLE_API_KEY}&alt=media`, {
        method: "GET"
      });

      if (!res.body) throw "ERR_NO_BODY " + audioFile.name;
      
      const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
      const readable = Readable.fromWeb(res.body);
      await finished(readable.pipe(fileStream));
    } catch (e) {
      console.error("update - Error while importing file:", e);
    }
  }

  interaction.reply({
    content: `Aggiornato.`
  });
}