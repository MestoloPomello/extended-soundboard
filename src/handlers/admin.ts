import { audioFiles, listAudioFiles } from "./audio";
import { logger } from "../classes/Logger";
import { File } from "megajs";
import path from "path";
import fs from "fs";

export interface AudioFileWithAuthors {
    id: string;
    name: string;
    birthtime: Date;
    authors: string[] | null;
    displayName: string;
    size: number;
}

export interface PaginatedResponse {
    files: AudioFileWithAuthors[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * Get paginated list of audio files with optional search
 */
export function getPaginatedAudioFiles(page: number = 1, pageSize: number = 50, search: string = ""): PaginatedResponse {
    let processedFiles = audioFiles.map((e) => {
        const authorMatch = e.name.match(/^\[(.+?)\]/);
        const authors = authorMatch
            ? authorMatch[1].split(/\s+/).map(a => a.toUpperCase())
            : null;
        const nameWithoutExtension = e.name.substring(0, e.name.lastIndexOf("."));
        const displayName = authors
            ? nameWithoutExtension.replace(/^\[.+?\]\s*/, '')
            : nameWithoutExtension;

        const filePath = path.join(process.cwd(), "audio", e.name);
        const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

        return {
            id: e.id,
            name: e.name,
            birthtime: e.birthtime,
            authors,
            displayName: displayName.replaceAll("_", " "),
            size: stats ? stats.size : 0
        };
    });

    // Apply search filter
    if (search) {
        const searchLower = search.toLowerCase();
        processedFiles = processedFiles.filter(file =>
            file.displayName.toLowerCase().includes(searchLower) ||
            file.name.toLowerCase().includes(searchLower) ||
            (file.authors && file.authors.some(a => a.toLowerCase().includes(searchLower)))
        );
    }

    // Sort by name
    processedFiles.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Pagination
    const total = processedFiles.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedFiles = processedFiles.slice(start, end);

    return {
        files: paginatedFiles,
        total,
        page,
        pageSize,
        totalPages
    };
}

/**
 * Refresh a single audio file from MEGA
 */
export async function refreshAudioFile(fileName: string): Promise<void> {
    if (!process.env.MEGA_URL) throw new Error("MEGA_URL non configurato");

    const localPath = path.join(process.cwd(), "audio", fileName);

    // Delete local file if exists
    if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        logger.log(`[ADMIN] Deleted local file: ${fileName}`);
    }

    // Download from MEGA
    const folderLink = process.env.MEGA_URL;
    const root = File.fromURL(folderLink);
    await root.loadAttributes();

    if (!root.children || root.children.length === 0) {
        throw new Error("Nessun file trovato nella cartella MEGA");
    }

    const megaFile = root.children.find(f => f.name === fileName);
    if (!megaFile) {
        throw new Error(`File ${fileName} non trovato su MEGA`);
    }

    logger.log(`[ADMIN] Downloading ${fileName} from MEGA...`);
    const fileStream = fs.createWriteStream(localPath);

    await new Promise<void>((resolve, reject) => {
        megaFile.download({})
            // @ts-ignore
            .pipe(fileStream)
            .on("finish", resolve)
            .on("error", reject);
    });

    logger.log(`[ADMIN] Refreshed: ${fileName}`);
    await listAudioFiles();
}

/**
 * Delete a local audio file
 */
export async function deleteLocalAudioFile(fileName: string): Promise<void> {
    const localPath = path.join(process.cwd(), "audio", fileName);

    if (!fs.existsSync(localPath)) {
        throw new Error("File non trovato");
    }

    fs.unlinkSync(localPath);
    logger.log(`[ADMIN] Deleted: ${fileName}`);
    await listAudioFiles();
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}