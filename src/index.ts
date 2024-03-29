import { Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { listAudioFiles } from "./drive/fetchAudio";
import { join } from "node:path";
import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection
} from "@discordjs/voice";


// Global vars
export let audioFiles: { id: string; name: string; }[] = [];


const client = new Client({
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("ready", async () => {
  deployCommands({ guildId: process.env.DEFAULT_GUILD! });
  audioFiles = await listAudioFiles();
  console.log("Extended Soundboard ready.");
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {

  // Slash commands handlers
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    if (commands[commandName as keyof typeof commands]) {
      commands[commandName as keyof typeof commands].execute(interaction);
    }
  }

  // Button handlers
  if (interaction.isButton()) {
    if (interaction.customId == "disconnectBtn") {
      getVoiceConnection(interaction.guildId as string)?.destroy();
      interaction.reply("Disconnesso dal canale.");
    } else {
      playAudio(interaction.guildId!, interaction.customId);
      interaction.deferUpdate();
    }
  }
});

client.login(config.DISCORD_TOKEN);


// Express server
const app = express();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname + '/views'));
app.get("/", (req, res) => {
  res.render("index", { audioFiles });
});

app.get("/api/play", (req, res) => {
  try {
    const { guildId, name } = req.query;
    playAudio(guildId as string, name as string);
    res.send(true);
  } catch (e) {
    console.error("API play - Error:", e);
    res.send(false);
  }
});

app.listen(3000, () => {
  console.log("Extended Soundboard server started.");
});


// Local functions

async function playAudio(guildId: string, audioName: string): Promise<void> {
  try {
    const voiceConnection = getVoiceConnection(guildId as string);
    const path = join(__dirname, '../audio/', audioName);
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
      console.log("Audio partito: " + audioName);
    });

    player.on('error', error => {
      throw `Error: ${error}`;
    });

    voiceConnection?.on('error', error => {
      throw error;
    });
  } catch (e) {
    console.error("playAudio - Error:", e);
  }
}