import { destroyGuildInstance } from "./handlers/connections";
import { guildSetup, loadGuilds, saveGuilds } from "./handlers/guilds";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { listAudioFiles, updateAudioFiles } from "./handlers/audio";
import { getVoiceConnection } from "@discordjs/voice";
import { existsSync, writeFileSync } from "fs";
import { GUILDS_LIST_PATH } from "./constants";
import { engine } from "express-handlebars";
import { logger } from "./classes/Logger";
import { commands } from "./commands";
import { SavedGuild } from "./types";
import { config } from "./config";
import session from "express-session";
import express from "express";
import path from "path";

// Import routes
import indexRoutes from "./routes/index";
import adminRoutes from "./routes/admin";
import audioRoutes from "./routes/audio";

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("clientReady", async () => {

	if (!existsSync(GUILDS_LIST_PATH)) {
		writeFileSync(GUILDS_LIST_PATH, "[]");
	}
	const guildsArray: SavedGuild[] = loadGuilds();

	logger.log("[STARTUP] Setting up guilds...");
	const promisesArray = guildsArray.map(async (guild) => {
		guildSetup({ guildObj: guild, client });
	});
	await Promise.all(promisesArray);

	await updateAudioFiles();
	await listAudioFiles();
	logger.log("Extended Soundboard ready.");
});

client.on("guildCreate", async (guild) => {
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
		logger.log("[VOICE] Disconnected from channel because everyone left.");
	}
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		if (commands[commandName as keyof typeof commands]) {
			commands[commandName as keyof typeof commands].execute(interaction as ChatInputCommandInteraction);
		}
	}

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

const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(express.json());
app.use(express.static("public"));

// Session configuration
app.use(session({
	secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: false,
		httpOnly: true,
		maxAge: 1000 * 60 * 60 * 24
	}
}));

// View engine configuration
app.engine("handlebars", engine({
	helpers: {
		eq: (a: string, b: string) => a === b,
		hasGroup: (context: any) => context && context.data && context.data.root && context.data.root.groupByAuthor
	}
}));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname + "/views"));

// Routes
app.use("/", indexRoutes);
app.use("/admin", adminRoutes);
app.use("/api", audioRoutes);

app.listen(PORT, "0.0.0.0", () => {
	logger.log("Extended Soundboard server started.");
});