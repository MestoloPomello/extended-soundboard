import {
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";

import { getVoiceConnection } from "@discordjs/voice";

export const data = new SlashCommandBuilder()
  .setName("leave")
  .setDescription("Lascia il canale attuale.");

export async function execute(interaction: CommandInteraction) {
  const currVoiceChannel = interaction?.member?.voice.channel;
  const destroyRes = getVoiceConnection(currVoiceChannel.guild.id)?.destroy();

  if (destroyRes) {
    interaction.reply({
      content: `Abbandonato ${currVoiceChannel.name}.`
    });
  } else {
    interaction.reply({
      content: `Non sono in un canale vocale.`
    });
  }  
}