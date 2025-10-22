import fs from "fs";
import path from "path";
import { File } from "megajs";

// Global
export let audioFiles: { id: string; name: string; }[] = [];

/**
 * Lists all the audio files inside the ./audio directory and stores them in the `audioFiles` global variable.
 * If the ./audio directory does not exist, it is created automatically.
 * Logs a message to the console when the function is finished, indicating how many files were found.
 * @returns {Promise<void>} A promise that resolves when the function is finished.
 */
export async function listAudioFiles(): Promise<void> {
    const audioDir = path.resolve("./audio");

    if (!fs.existsSync(audioDir)) {
        console.warn("[AUDIO] Cartella ./audio non trovata, creata automaticamente");
        fs.mkdirSync(audioDir, { recursive: true });
    }

    const files = fs.readdirSync(audioDir, { withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => {
            const filePath = path.join(audioDir, entry.name);
            const stats = fs.statSync(filePath);
            return {
                id: entry.name,
                name: entry.name,
                birthtime: stats.birthtime
            };
        });

    audioFiles = files;

    console.log(`[AUDIO] ${audioFiles.length} file trovati in ${audioDir}`);
}

/**
 * Download the audio files from the MEGA folder specified in the .env file to the ./audio directory.
 * If a file with the same name already exists in the destination directory, it is skipped.
 * If the MEGA folder does not contain any files, a message is logged to the console and the function returns.
 * If an error occurs while downloading a file, an error message is logged to the console.
 * The function logs a message to the console when it starts and finishes.
 */
export async function updateAudioFiles() {
    console.log("[AUDIO] Update started");

    if (!process.env.MEGA_URL) throw "Manca l'URL del MEGA nel .env, porca troia!";

    const folderLink = process.env.MEGA_URL;
    const destinationBase = path.resolve("./audio");

    if (!fs.existsSync(destinationBase)) {
        fs.mkdirSync(destinationBase, { recursive: true });
    }

    const root = File.fromURL(folderLink);
    await root.loadAttributes();

    if (!root.children || root.children.length === 0) {
        console.log("[AUDIO] Nessun file trovato nella cartella MEGA");
        return;
    }

    for (const file of root.children) {
        try {
            const destPath = path.join(destinationBase, file.name!);
            if (fs.existsSync(destPath)) continue;

            process.stdout.write(`[AUDIO DOWNLOAD] ${file.name}... `);
            const fileStream = fs.createWriteStream(destPath);

            await new Promise<void>((resolve, reject) => {
                file.download({})
                    // @ts-ignore
                    .pipe(fileStream)
                    .on("finish", resolve)
                    .on("error", reject);
            });

            process.stdout.write("FINISHED\n");
        } catch (err) {
            process.stdout.write(`ERROR: ${err}\n`);
        }
    }

    console.log("[AUDIO] Update finished");
}