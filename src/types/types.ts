/* eslint-disable @typescript-eslint/no-explicit-any */
import { Awaitable } from "discord.js";
export type funcArg = (...args: any[]) => Awaitable<void>;