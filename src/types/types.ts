/* eslint-disable @typescript-eslint/no-explicit-any */
import { Awaitable } from "discord.js";
import { ObjectId } from "mongodb";
export type funcArg = (...args: any[]) => Awaitable<void>;
export interface nullGuildDb {
    guildId: string;
    enabledAdvCommand: boolean;
    channelNewUsers: string | null;
    rolesNewUsers: string[] | null
}
export interface guildDb extends nullGuildDb{
    _id: ObjectId;
}