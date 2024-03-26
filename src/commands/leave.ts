import {
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";

import { destroyVoiceConnection } from "../shared/voiceConnectionHandler";

export const data = new SlashCommandBuilder()
  .setName("leave")
  .setDescription("Lascia il canale attuale.");

export async function execute(interaction: CommandInteraction) {
  const currVoiceChannel = interaction?.member?.voice.channel;
  const destroyRes = destroyVoiceConnection(currVoiceChannel.guild.id);

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