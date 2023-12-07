/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmbedBuilder, GuildMember, GuildTextBasedChannel } from "discord.js";
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";
import { getGuildDb } from "../../../libs/GuildDB";
import giphy from "giphy-api";
import { config } from "../../../config/config";
import { getRandomInt } from "../../utils/etc";


export class AutoSendMessageAfterJoinMember extends BaseModule {
	giphyApi: giphy.Giphy;
	constructor(client: BotCLient) {
		super(client, "AutoSendMessageAfterJoinMember");
		this.giphyApi = giphy(config.giphyApiKey);
	}
	async getGifImage(request: string) {
		const gifs = await this.giphyApi.search(request);
		return gifs.data[getRandomInt(gifs.data.length)].images.original.url;
	}
	async generateEmbed(member: GuildMember, isLogin: boolean) {
		const embed = new EmbedBuilder();
		if (isLogin) {
			const gif = await this.getGifImage("welcome");
			embed.setImage(gif);
			embed.setTitle("Новый пользователь!");
			embed.setDescription(`<@${member.id}> Добро пожаловать на сервер\n[${member.guild.name}]`);
		} else {
			const gif = await this.getGifImage("bye");
			embed.setImage(gif);
			embed.setTitle("Выход с сервера!");
			embed.setDescription(`<@${member.id}> Вышел с сервера\n[${member.guild.name}]`);
		}
		return embed;
	}
	async getChannel(guildID: string, channelId: string) {
		const guild = await this.client.guilds.fetch(guildID);
		const channel = (await guild.channels.fetch(channelId)) as GuildTextBasedChannel | null;
		return channel;
	}
	async sendAlarm(member: GuildMember, isLogin: boolean) {
		const guildDb = await getGuildDb(member.guild.id);
		if (guildDb === null) return;
		if (guildDb.guildInfo.channelNewUsers === null) return;
		const channel = await this.getChannel(member.guild.id, guildDb.guildInfo.channelNewUsers);
		if (channel === null) return;
		const embed = await this.generateEmbed(member, isLogin);
		try {
			await channel.send({
				"embeds": [embed]
			});
		} catch (_) {}
	}
	setHandlers() {
		const callbackMemberAdd = async (member: GuildMember) => {
			await this.sendAlarm(member, true);
		};
		const callbackMemberRemove = async (member: GuildMember) => {
			await this.sendAlarm(member, false);
		};
		this.regCallback("guildMemberAdd", callbackMemberAdd);
		this.regCallback("guildMemberRemove", callbackMemberRemove);
	}
	public async init(): Promise<boolean> {
		this.setHandlers();
		return true;
	}
}