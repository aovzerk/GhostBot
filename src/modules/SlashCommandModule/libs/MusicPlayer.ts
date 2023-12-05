/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message, VoiceState } from "discord.js";
import { BotCLient } from "../../../Client";
import { Player, Rest } from "lavacord/dist/discord.js";
import { URL } from "url";
import { BaseCallbackWatcher } from "../../../baseClasses/BaseCallbackWatcher";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
type SongInfo = {
    "title": string,
    "url": string,
    "author": string,
    "track": string,
	"thumb": string,
	"request_by": string
}
enum Modes {
    "NORMAL" = 0,
    "REPEAT" = 1
}
enum PlayerButtonsEnum {
    "STOP_PLAY" = "stop_q",
    "NEXT_TRACK" = "next_t",
	"CHANGE_MOD" = "rep_m",
	"SHOW_QUEUE" = "queue_s"
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
	voiceChannelId: string | null = null;
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
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("queue_s")
					.setLabel("Очередь")
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
	async getSong(search: string, requester: GuildMember): Promise<SongInfo | null> {
		try {
			const request = this.isUrl(search) ? search : `ytsearch:${search}`;
			const node = this.client.slashCommandModule.managerLavalink.idealNodes[0];
			const data = (await Rest.load(node, request)) as any;
			const songInfo: SongInfo = {
				"title": data.tracks[0].info.title,
				"url": data.tracks[0].info.uri,
				"author": data.tracks[0].info.author,
				"track": data.tracks[0].track,
				"thumb": `https://img.youtube.com/vi/${data.tracks[0].info.identifier}/0.jpg`,
				"request_by": requester.id
			};
			return songInfo;
		} catch (_) {
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
	generateTrackEmbed(songInfo: SongInfo) {
		const embed = new EmbedBuilder()
			.setTitle(songInfo.title)
			.setDescription(`${songInfo.author}\n\n запросил: <@${songInfo.request_by}>`)
			.setURL(songInfo.url)
			.setThumbnail(songInfo.thumb);
		return embed;
	}
	generateEmbedQueue() {
		const embed = new EmbedBuilder()
		.setTitle("Очередь");
		let desc = "";
		for(const song of this.queue) {
			desc = `${desc}\n[${song.title}](${song.url}) - <@${song.request_by}>`;
		}
		embed.setDescription(desc === "" ? "Очередь пуста" : desc);
		return embed;
	}
	async sendEmbedPlayer(songInfo: SongInfo, interaction: ChatInputCommandInteraction): Promise<Message> {
		const embed = this.generateTrackEmbed(songInfo);
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
		const embed = this.generateTrackEmbed(songInfo);
		embed.setTitle(songInfo.author);
		embed.setDescription(`Трек ${songInfo.title} добавлен в очередь`);
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
			"content": `Ошибка добавления трека в очередь, возможно вы не в том же голосов канале что и бот <#${this.voiceChannelId}>`
		});
	}
	async changeSongMessage(songInfo: SongInfo): Promise<Message> {
		const embed = this.generateTrackEmbed(songInfo);
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
		this.player = await this.client.slashCommandModule.managerLavalink.join({
			"guild": this.interaction.guild!.id,
			"channel": this.member.voice.channelId!,
			"node": "1"
		});
		this.voiceChannelId = this.member.voice.channelId;
		return this.player;
	}
	setHandlerVoiceUpdate() {
		const callback = async (oldState: VoiceState, newState: VoiceState) => {
			if(newState.member!.id !== this.client.user!.id) return;
			if(newState.channelId === null) {
				await this.destroy();
			}
		}
		this.regCallback("voiceStateUpdate", callback)
	}
	setHandlersButtons() {
		const callback = async (interaction: ButtonInteraction) => {
			if (!this.msg) return;
			if (!interaction.isButton()) return;
			if(interaction.customId === PlayerButtonsEnum.SHOW_QUEUE) {
				const embed = this.generateEmbedQueue();
				const msg = await (await interaction.reply({
					"embeds": [embed]
				})).fetch();
				deleteMsgAfterTimeout(msg, 7000);
				return;
			}
			if (interaction.member!.user.id !== this.member.id) {
                await interaction.reply({
					"ephemeral": true, "content": "Вы не DJ!"
				});
                return;
            }
            this.lastEvent = interaction.customId;
			if (interaction.customId === PlayerButtonsEnum.STOP_PLAY) {
				this.isDestroy = true;
				await this.destroy();
				return;
			}
			if (interaction.customId === PlayerButtonsEnum.NEXT_TRACK) {
				if(this.queue.length === 0) this.mode = Modes.NORMAL;
				await this.player!.stop();
				await interaction.reply({
					"ephemeral": true, "content": "Играю следующий трек"
				});
				return;
			}
            if (interaction.customId === PlayerButtonsEnum.CHANGE_MOD) {
                if(this.mode === Modes.REPEAT) this.mode = Modes.NORMAL;
                else this.mode = Modes.REPEAT;
                await this.changeSongMessage(this.nowPlaying!);
				await interaction.reply({
					"ephemeral": true, "content": "Режим воспроизведения изменен"
				});
				return;
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
		if(member.voice.channelId !== this.voiceChannelId) {
			await this.sendErrorAddSong(interaction);
			return;
		}
		const option = interaction.options.getString("request")!;
		const song = await this.getSong(option, member);
		if (!song) {
			await this.sendErrorSearchSong(interaction);
			return;
		}
		this.queue.push(song);
		const msg = await this.sendEmbedAddedSong(song, interaction);
		deleteMsgAfterTimeout(msg, 7000);
	}
	async destroy() {
		MusicPlayer.instances.delete(this.interaction.guild!.id);
		this.player!.removeAllListeners("end");
		try {
			await this.player!.stop();
		} catch (_) {}
		try {
			await this.player!.destroy();
		} catch (_) {}
		try {
			await this.client.slashCommandModule.managerLavalink.leave(this.member.guild.id);
		} catch (_) {}
		try {
			await this.msg!.delete();
		} catch (_) {}
		this.destroyCallbacks();
	}
	async init() {
		try {
			if(MusicPlayer.instances.has(this.interaction.guild!.id)) throw new Error(`The player has already been created for this guild ( ${this.interaction.guild!.id} )`);
			MusicPlayer.instances.set(this.interaction.guild!.id, this);
			await this.interaction.deferReply();
			this.setHandlersButtons();
			const option = this.interaction.options.getString("request")!;
			const song = await this.getSong(option, this.member);
			if (!song) {
				await this.sendErrorSearchSong(this.interaction);
				await this.destroy();
				return;
			}
			this.nowPlaying = song;
			await this.createPlayer();
			this.setHandlersPlayer();
			await this.sendEmbedPlayer(song!, this.interaction);
			await this.player!.play(song.track);
			return true;
		} catch (error) {
			console.log(error);
			MusicPlayer.instances.delete(this.interaction.guild!.id);
			await this.destroy();
			await this.interaction.editReply({
				"content": "Упс, что-то сломалось("
			})
		}
		
	}
}