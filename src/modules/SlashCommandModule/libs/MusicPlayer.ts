/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message } from "discord.js";
import { BotCLient } from "../../../Client";
import { Player, Rest } from "lavacord/dist/discord.js";
import { URL } from "url";
import { BaseCallbackWatcher } from "../../../baseClasses/BaseCallbackWatcher";
type SongInfo = {
    "title": string,
    "url": string,
    "author": string,
    "track": string
}
enum Modes {
    "NORMAL" = 0,
    "REPEAT" = 1
}
export class MusicPlayer extends BaseCallbackWatcher {
	static instances: Map<string, MusicPlayer> = new Map();
	client: BotCLient;
	interaction: ChatInputCommandInteraction;
	member: GuildMember;
    nowPlaying: SongInfo | null = null;
	player: Player | null = null;
	msg: Message | null = null;
	actionRow: ActionRowBuilder<ButtonBuilder>;
	actionRowModes: ActionRowBuilder<ButtonBuilder>;
    lastEvent: string | null = null;
	isDestroy: boolean = false;
    mode: Modes = Modes.NORMAL;
	queue: SongInfo[] = [];
	constructor(client: BotCLient, interaction: ChatInputCommandInteraction, member: GuildMember) {
		super(client);
		this.client = client;
		this.interaction = interaction;
		this.member = member;
		this.actionRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("stop_q")
					.setLabel("Выключить муызку")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("next_t")
					.setLabel("Следующий трек")
					.setStyle(ButtonStyle.Primary)
			);
		this.actionRowModes = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("rep_m")
					.setLabel("Зациклить трек")
					.setStyle(ButtonStyle.Primary)
			);
	}
	async getSong(search: string): Promise<SongInfo | null> {
		try {
			const request = this.isUrl(search) ? search : `ytsearch:${search}`;
			const node = this.client.slashCommandModule.manager.idealNodes[0];
			const data = (await Rest.load(node, request)) as any;
			const songInfo: SongInfo = {
				"title": data.tracks[0].info.title,
				"url": data.tracks[0].info.uri,
				"author": data.tracks[0].info.author,
				"track": data.tracks[0].track
			};
			return songInfo;
		} catch (error) {
			return null;
		}

	}
	isUrl(str: string): boolean {
		try {
			new URL(str);
			return true;
		} catch (_) {
			return false;
		}
	}
	async sendEmbedPlayer(songInfo: SongInfo, interaction: ChatInputCommandInteraction): Promise<Message> {
		const embed = new EmbedBuilder()
			.setTitle(songInfo.title)
			.setDescription(songInfo.author)
			.setURL(songInfo.url);
        let footerText = "Mode:"
        if (this.mode === Modes.NORMAL) footerText = `${footerText} обычный`
        if (this.mode === Modes.REPEAT) footerText = `${footerText} повтор`
        embed.setFooter({
            "text": footerText
        });
		this.msg = await interaction.editReply({
			"embeds": [embed], "components": [this.actionRow, this.actionRowModes]
		});
		return this.msg;
	}
	async sendEmbedAddedSong(songInfo: SongInfo, interaction: ChatInputCommandInteraction): Promise<Message> {
		const embed = new EmbedBuilder()
			.setTitle(songInfo.author)
			.setDescription(`Трек ${songInfo.title} добавлен в очередь`)
			.setURL(songInfo.url);
		const msg = await interaction.editReply({
			"embeds": [embed]
		});
		return msg;
	}
	async sendErrorSearchSong(interaction: ChatInputCommandInteraction) {
		await interaction.editReply({
			"content": "Произошла ошибка в поиске трека"
		});
	}
	async sendErrorAddSong(interaction: ChatInputCommandInteraction) {
		await interaction.editReply({
			"content": "Вы не DJ"
		});
	}
	async changeSongMessage(songInfo: SongInfo): Promise<Message> {
		const embed = new EmbedBuilder()
			.setTitle(songInfo.title)
			.setDescription(songInfo.author)
			.setURL(songInfo.url);
        let footerText = "Mode:"
        if (this.mode === Modes.NORMAL) footerText = `${footerText} обычный`
        if (this.mode === Modes.REPEAT) footerText = `${footerText} повтор`
        embed.setFooter({
            "text": footerText
        });
		await this.msg!.edit({
			"embeds": [embed]
		});
		return this.msg!;
	}
	async createPlayer(): Promise<Player> {
		this.player = await this.client.slashCommandModule.manager.join({
			"guild": this.interaction.guild!.id,
			"channel": this.member.voice.channelId!,
			"node": "1"
		});
		return this.player;
	}
	setHandlersButtons() {
		const callback = async (interaction: ButtonInteraction) => {
			if (!this.msg) return;
			if (!interaction.isButton()) return;
			if (interaction.message.id !== this.msg!.id) {
                await interaction.reply({
					"ephemeral": true, "content": "Вы не DJ!"
				});
                return;
            }
            this.lastEvent = interaction.customId;
			if (interaction.customId === "stop_q") {
				this.isDestroy = true;
				await this.destroy();
				return;
			}
			if (interaction.customId === "next_t") {
				await this.player!.stop();
                if(this.queue.length === 0) this.mode = Modes.NORMAL;
				await interaction.reply({
					"ephemeral": true, "content": "Играю следующий трек"
				});
			}
            if (interaction.customId === "rep_m") {
                if(this.mode === Modes.REPEAT) this.mode = Modes.NORMAL;
                else this.mode = Modes.REPEAT;
                await this.changeSongMessage(this.nowPlaying!);
				await interaction.reply({
					"ephemeral": true, "content": "Режим воспроизведения изменен"
				});
			}
		};
		this.regCallback("interactionCreate", callback);
	}
	setHandlersPlayer() {
		this.player!.on("end", async () => {
			if (this.isDestroy) return;
			if (this.queue.length === 0 && this.mode !== Modes.REPEAT) {
				await this.destroy();
				return;
			}
			let song = this.nowPlaying! // если мод повтор то берем прошлый трек который играл что его снова играть
            if(this.mode === Modes.NORMAL || this.lastEvent === "next_t") {
                song = this.queue.shift()!;
                this.nowPlaying = song;
                this.lastEvent = null;
            }
			await this.changeSongMessage(song);
			await this.player!.play(song.track);
		});
	}
	async addSong(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const member = await interaction.guild!.members.fetch(interaction.member!.user.id);
		if (member!.id != this.member.id) {
			return this.sendErrorAddSong(interaction);
		}
		const option = interaction.options.getString("request")!;
		const song = await this.getSong(option);
		if (!song) {
			await this.sendErrorSearchSong(interaction);
			return;
		}
		this.queue.push(song);
		const msg = await this.sendEmbedAddedSong(song, interaction);
		setTimeout(async () => {
			try {
				await msg.delete();
			} catch (_) {}

		}, 7000);
	}
	async destroy() {
		MusicPlayer.instances.delete(this.interaction.guild!.id);
		this.player!.removeAllListeners("end");
		await this.player!.stop();
		await this.player!.destroy();
		await this.client.slashCommandModule.manager.leave(this.member.guild.id);
		try {
			await this.msg!.delete();
		} catch (_) {}
		this.destroyCallbacs();
	}
	async init() {
		MusicPlayer.instances.set(this.interaction.guild!.id, this);
		await this.interaction.deferReply();
		this.setHandlersButtons();
		const option = this.interaction.options.getString("request")!;
		const song = await this.getSong(option);
		if (!song) {
			await this.sendErrorSearchSong(this.interaction);
			return;
		}
        this.nowPlaying = song;
		await this.createPlayer();
		this.setHandlersPlayer();
		await this.sendEmbedPlayer(song!, this.interaction);
		await this.player!.play(song.track);
		return true;
	}
}