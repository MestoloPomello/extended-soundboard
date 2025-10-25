require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
import { destroyGuildInstance, getGuildInstance } from "./handlers/connections";
import { createAudioResource, getVoiceConnection } from "@discordjs/voice";
import { guildSetup, loadGuilds, saveGuilds } from "./handlers/guilds";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { listAudioFiles, updateAudioFiles } from "./handlers/audio";
import { existsSync, writeFileSync } from "fs";
import { GUILDS_LIST_PATH } from "./constants";
import { engine } from "express-handlebars";
import { audioFiles } from "./handlers/audio";
import { commands } from "./commands";
import { SavedGuild } from "./types";
import { config } from "./config";
import express from "express";
import path from "path";

const client = new Client({
    intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("clientReady", async () => {

    if (!existsSync(GUILDS_LIST_PATH)) {
        writeFileSync(GUILDS_LIST_PATH, "[]");
    }
    const guildsArray: SavedGuild[] = loadGuilds();

    // Guilds setup
    console.log("[STARTUP] Setting up guilds...");
    const promisesArray = guildsArray.map(async (guild) => {
        guildSetup({ guildObj: guild, client });
    });
    await Promise.all(promisesArray);

    await updateAudioFiles();
    await listAudioFiles();
    console.log("Extended Soundboard ready.");
});

client.on("guildCreate", async (guild) => {
    // Add the server to the list (its ID will be used to refresh commands)
    const guildsArray: SavedGuild[] = loadGuilds();
    const newGuild = { id: guild.id, status: "" };
    guildsArray.push(newGuild);
    saveGuilds(guildsArray);
    guildSetup({ guildObj: newGuild });
});

client.on("voiceStateUpdate", async (oldState, newState) => {
    const guildId = oldState.guild.id;
    const myConn = getVoiceConnection(guildId);

    if (
        myConn &&
        myConn.joinConfig.channelId == oldState.channelId &&
        myConn.joinConfig.channelId != newState.channelId &&
        oldState.channel?.members.size == 1
    ) {
        destroyGuildInstance(guildId);
        console.log("[VOICE] Disconnected from channel because everyone left.");
    }
});

client.on("interactionCreate", async (interaction) => {
    // Slash commands handlers
    if (interaction.isCommand()) {
        const { commandName } = interaction;
        if (commands[commandName as keyof typeof commands]) {
            commands[commandName as keyof typeof commands].execute(interaction as ChatInputCommandInteraction);
        }
    }

    // Button handlers
    if (interaction.isButton()) {
        if (interaction.customId == "disconnectBtn") {
            destroyGuildInstance(interaction.guildId as string);
            interaction.update({
                components: []
            });
        }
    }
});

client.login(config.DISCORD_TOKEN);

// Express server
const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.static("public"));

app.engine("handlebars", engine({
    helpers: {
        eq: (a: string, b: string) => a === b
    }
}));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname + "/views"));

app.get("/", (req, res) => {
    const sortBy = req.query.sort as string || 'name';

    let sortedFiles = [...audioFiles];
    if (sortBy === 'date') {
        sortedFiles.sort((a, b) => b.birthtime.getTime() - a.birthtime.getTime());
    } else {
        sortedFiles.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.render("index", {
        audioFiles: sortedFiles.map((e) => {
            return {
                ...e,
                formattedName: e.name
                    .toLowerCase()
                    .replaceAll("_", " ")
                    .substring(0, e.name.lastIndexOf("."))
            };
        }),
        currentSort: sortBy
    });
});

app.get("/api/play", async (req, res) => {
    try {
        const { guildId, name } = req.query;
        const playAudioRes = await playAudio(guildId as string, name as string);
        res.status(200).send({ status: 200, message: playAudioRes });
    } catch (e) {
        console.error("API play - Error:", e);
        res.status(500).send({ status: 500, message: e as string });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Extended Soundboard server started.");
});

// Local functions

async function playAudio(
    guildId: string,
    audioName: string
): Promise<{ status: number; message: string }> {
    try {
        const audioPath = path.join(process.cwd(), "audio", audioName);
        const resource = createAudioResource(audioPath);

        const guildInstance = getGuildInstance(guildId, false)!;
        if (!guildInstance.player) throw "player non istanziato (serve /join)";

        guildInstance.player.play(resource);

        console.log("[playAudio] Audio partito: " + audioName);
        return { status: 200, message: "Audio partito." };
    } catch (e) {
        console.error("[playAudio] Error:", e);
        return { status: 500, message: e as string };
    }
}