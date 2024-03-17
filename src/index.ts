import { Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";

import {
  getVoiceConnection
} from "@discordjs/voice";


const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

client.once("ready", () => {

  // TEST ONLY
  //deployCommands({ guildId: '379286033843617794' });  // server P A
  deployCommands({ guildId: '357575089799299072' });  // server Ismail

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
    if (interaction.customId == 'disconnectBtn') {
      const voiceConnection = getVoiceConnection(interaction.guildId);
      voiceConnection?.destroy();
      interaction.reply("Disconnesso dal canale.");
    }
  }
});

client.login(config.DISCORD_TOKEN);