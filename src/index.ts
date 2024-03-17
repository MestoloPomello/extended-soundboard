import { Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import fs from "fs";
import { saveAs } from "file-saver";
import { join } from "node:path";

import {
  NoSubscriberBehavior,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
} from "@discordjs/voice";
import { getExistingVoiceConnection } from "./shared/voiceConnectionHandler";
import got from "got";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

client.once("ready", () => {
  // TEST ONLY
  //deployCommands({ guildId: '379286033843617794' });  // server P A
  deployCommands({ guildId: "357575089799299072" }); // server Ismail

  console.log("Extended Soundboard ready.");
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  // if (!interaction.isCommand()) {
  //   return;
  // }

  // Commands handlers
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    if (commands[commandName as keyof typeof commands]) {
      commands[commandName as keyof typeof commands].execute(interaction);
    }
  }

  // Button handlers
  if (interaction.isButton()) {
    const voiceConnection = getExistingVoiceConnection();
    if (!voiceConnection) {
      interaction.reply("Devo essere in un canale.");
      return;
    }

    if (interaction.customId == "disconnectBtn") {
      voiceConnection?.destroy();
      interaction.reply("Disconnesso dal canale.");
    } else {
      // const track = interaction.customId;
      // const volume = 100;

      try {
        const fileID = "1PUXgOrp9ukhXbbRseZOLJ3RNcjJzgVxZ";
        const testURL = `https://www.googleapis.com/drive/v3/files/${fileID}?key=${process.env.GOOGLE_API_KEY}&alt=media`;
        const test = await fetch(`https://www.googleapis.com/drive/v3/files/${fileID}?key=${process.env.GOOGLE_API_KEY}&alt=media`, {
          "method": "GET"
        });

        const resource = createAudioResource("./sample-3s.ogg");
        
        // console.log("resource before", resource);

        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
          },
        });

        const subscription = voiceConnection.subscribe(player);
        // console.log("subscription", subscription);

        player.play(resource);
        // console.log("resource after", resource);

        player.on('error', error => {
          console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });
      } catch (e) {
        console.error("e", e);
      }
    }
  }
});

client.login(config.DISCORD_TOKEN);