import {
    CreateVoiceConnectionOptions,
    JoinVoiceChannelOptions,
    VoiceConnection,
    joinVoiceChannel,
    getVoiceConnection
} from "@discordjs/voice";

let voiceConnection: VoiceConnection | undefined;

export function createVoiceConnection(setupObj: CreateVoiceConnectionOptions & JoinVoiceChannelOptions): VoiceConnection | undefined {
    voiceConnection = joinVoiceChannel(setupObj);
    return voiceConnection;
}

// export function getExistingVoiceConnection(guildId: string): VoiceConnection | undefined {
//     return voiceConnection;
// }

export function destroyVoiceConnection(guildId: string): boolean {
    const currVoiceConnection = getVoiceConnection(guildId);
    if (currVoiceConnection) {
        currVoiceConnection.destroy();
        return true;
    } else return false;
}