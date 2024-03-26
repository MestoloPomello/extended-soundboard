import {
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("test")
  .setDescription("Comando di test variabile.");

export async function execute(interaction: CommandInteraction) {

  const target = interaction.options.getUser('target');

  interaction.reply({
    content: `Vai a cagare stronzo`
  });
}