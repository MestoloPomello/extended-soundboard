import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";

import { createVoiceConnection } from "../shared/voiceConnectionHandler";

import { audioFiles } from "..";

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("Arriva la soundboard.");

export async function execute(interaction: CommandInteraction) {

  // Disconnect button (reply)
  const disconnectBtn = new ButtonBuilder()
    .setCustomId('disconnectBtn')
    .setLabel('Disconnect')
    .setStyle(ButtonStyle.Danger);

  const replyRow = new ActionRowBuilder()
    .addComponents(disconnectBtn);

  await interaction.reply({
    // content: `Scegli un audio`,
    components: [replyRow]
  });


  // Follow ups

  const chunkSize = 5;
  for (let i = 0; i < audioFiles.length; i += chunkSize) {
    const buttonsArray: ButtonBuilder[] = [];
    const chunk = audioFiles.slice(i, i + chunkSize);

    for (const audioFile of chunk) {
      const newBtn = new ButtonBuilder()
        .setCustomId(audioFile.id)
        .setLabel(audioFile.name.split(".mp3")[0])
        .setStyle(ButtonStyle.Primary);
      buttonsArray.push(newBtn);
    }

    const row = new ActionRowBuilder()
      .addComponents(buttonsArray);

    await interaction.followUp({
      components: [row]
    });
  }
}