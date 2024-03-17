import {
    CreateVoiceConnectionOptions,
    JoinVoiceChannelOptions,
    VoiceConnection,
    joinVoiceChannel
} from "@discordjs/voice";

let voiceConnection: VoiceConnection | undefined;

export function createVoiceConnection(setupObj: CreateVoiceConnectionOptions & JoinVoiceChannelOptions): VoiceConnection | undefined {
    voiceConnection = joinVoiceChannel(setupObj);
    return voiceConnection;
}

export function getExistingVoiceConnection(): VoiceConnection | undefined {
    return voiceConnection;
}