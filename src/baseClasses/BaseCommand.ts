import { ChatInputCommandInteraction, Message } from "discord.js";
import { BotCLient } from "../Client";

export interface CommandDescription {
    name: string;
    load: boolean;
}
export interface CommandArgs {
    client: BotCLient;
    message: Message;
    args: string[];
}
export interface CommandInteractionArgs {
    client: BotCLient;
    interaction: ChatInputCommandInteraction;
}
export interface BaseCommand {
    run(params: CommandArgs | CommandInteractionArgs): Promise<CommandResponse>;
    description: CommandDescription;
}
export enum CommandState {
    "OK" = 0,
    "ERROR" = 1
}
export interface CommandResponse {
    state: CommandState;
    message: any;
    error?: any
}