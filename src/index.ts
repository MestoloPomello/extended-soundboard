import { Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { listAudioFiles } from "./drive/fetchAudio";
import { join } from "node:path";
import { createReadStream } from "node:fs";
import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection
} from "@discordjs/voice";
import { createVoiceConnection } from "./shared/voiceConnectionHandler";


export let audioFiles: { id: string; name: string; }[] = [];


const client = new Client({
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("ready", async () => {
  // TEST ONLY
  //deployCommands({ guildId: '379286033843617794' });  // server P A
  deployCommands({ guildId: "357575089799299072" }); // server Ismail

  audioFiles = await listAudioFiles();
  console.log("Extended Soundboard ready.");
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {

  // Commands handlers
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    if (commands[commandName as keyof typeof commands]) {
      commands[commandName as keyof typeof commands].execute(interaction);
    }
  }

  // Button handlers
  if (interaction.isButton()) {
    const voiceConnection = getVoiceConnection(interaction.guildId as string) || createVoiceConnection({
      channelId: interaction.channelId,
      guildId: interaction.guildId!,
      adapterCreator: interaction.guild?.voiceAdapterCreator!
    });

    if (interaction.customId == "disconnectBtn") {
      voiceConnection?.destroy();
      interaction.reply("Disconnesso dal canale.");
    } else {
      try {
        // const URL = `https://www.googleapis.com/drive/v3/files/${interaction.customId}?key=${process.env.GOOGLE_API_KEY}&alt=media`;
        const path = join(__dirname, '../audio/', interaction.customId);
        const resource = createAudioResource(path);

        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
          },
        });

        voiceConnection?.subscribe(player);
        player.play(resource);

        // Hooks
        player.on(AudioPlayerStatus.Playing, () => {
          console.log("Audio partito: " + interaction.customId);
        });
        player.on('error', error => {
          throw `Error: ${error}`;
        });
        player.on(AudioPlayerStatus.Idle, () => {
          console.log("Audio finito: " + interaction.customId);
        });

        interaction.deferUpdate();
      } catch (e) {
        console.error("e", e);
      }
    }
  }
});

client.login(config.DISCORD_TOKEN);