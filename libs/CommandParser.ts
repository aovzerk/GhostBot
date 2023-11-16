import { ChatInputCommandInteraction, Message } from "discord.js";
import { BaseCommand, CommandArgs, CommandInteractionArgs } from "../src/baseClasses/BaseCommand";
import { BotCLient } from "../src/Client";
interface CommandParsed{
    command: BaseCommand;
    args: CommandArgs | CommandInteractionArgs;
}
export class ParserMsgCommand {
	client: BotCLient;
	message: Message;
	constructor(client: BotCLient, message: Message) {
		this.client = client;
		this.message = message;
	}
	public parse(): CommandParsed | undefined {
		const command = this.getCommand(this.client.prefix);
		if (command == undefined) return command;
		const args = this.getCommandArgs();
		return {
			"command": command,
			"args": {
				"args": args,
				"client": this.client,
				"message": this.message
			}
		};
	}
	public getCommandArgs(): string[] {
		const commandName = this.getCommandName();
		const args = this.message.content.split(" ").filter(arg => arg.trim() != "" && arg != commandName);
		return args;
	}
	private getCommand(prefix: string): BaseCommand | undefined {
		const commandName = this.getCommandName();
		if (commandName.startsWith(prefix)) {
			const command = this.client.chatCommandModule.commands.get(commandName.replace(prefix, "")) as BaseCommand;
			if (command == undefined) {
				return undefined;
			}
			return command;
		}
		return undefined;
	}
	private getCommandName() {
		const commandText = this.message.content.trim();
		return commandText.split(" ")[0];
	}
}
export class ParserInteractionCommand {
	client: BotCLient;
	interaction: ChatInputCommandInteraction;
	constructor(client: BotCLient, interaction: ChatInputCommandInteraction) {
		this.client = client;
		this.interaction = interaction;
	}
	public parse(): CommandParsed | undefined {
		if (!this.interaction.isCommand()) return undefined;
		const command = this.getCommand();
		if (command == undefined) return;
		return {
			"command": command,
			"args": {
				"client": this.client,
				"interaction": this.interaction
			}
		};
	}
	private getCommand(): BaseCommand | undefined {
		const command = this.client.slashCommandModule.commands.get(this.interaction.commandName) as BaseCommand;
		if (command == undefined) {
			return undefined;
		}
		return command;
	}
}
export class CommandParser {
	client: BotCLient;
	constructor(client: BotCLient) {
		this.client = client;
	}
	getParser(object: Message | ChatInputCommandInteraction): ParserMsgCommand | ParserInteractionCommand | null {
		if (object instanceof Message) {
			return new ParserMsgCommand(this.client, object);
		}
		if (object instanceof ChatInputCommandInteraction) {
			return new ParserInteractionCommand(this.client, object);
		}
		return null;
	}
}