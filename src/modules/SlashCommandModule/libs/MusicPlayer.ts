/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message, VoiceState } from "discord.js";
import { BotCLient } from "../../../Client";
import { Player, Rest } from "lavacord/dist/discord.js";
import { URL } from "url";
import { BaseCallbackWatcher } from "../../../baseClasses/BaseCallbackWatcher";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
import { SongInfo } from "./types";
import { ShowQueueMessageWatcher } from "./ShowQueueMessageWatcher";
enum Modes {
    "NORMAL" = 0,
    "REPEAT" = 1,
	"REPEAT_Q" = 3
}
enum PlayerButtonsEnum {
    "STOP_PLAY" = "stop_q",
    "NEXT_TRACK" = "next_t",
	"REPEAT_SONG" = "rep_s",
	"SHOW_QUEUE" = "queue_s",
	"REPEAT_QUEUE" = "rep_q",
	"SHUFFLE_QUEUE" = "shuf",
	"PAUSE" = "pause_t"
}
export class MusicPlayer extends BaseCallbackWatcher {
	static instances: Map<string, MusicPlayer> = new Map();
	client: BotCLient;
	queueWatchers: ShowQueueMessageWatcher[] = [];
	interaction: ChatInputCommandInteraction;
	member: GuildMember;
    nowPlaying: SongInfo | null = null;
	player: Player | null = null;
	msg: Message | null = null;
	actionRow: ActionRowBuilder<ButtonBuilder>;
	actionRowModes: ActionRowBuilder<ButtonBuilder>;
    lastEvent: string | null = null;
	isDestroy: boolean = false;
	tmpQueue: SongInfo[] | null = null;
	nowPlayingTmpQueueId: number | null = null;
	voiceChannelId: string | null = null;
    mode: Modes = Modes.NORMAL;
	queue: SongInfo[] = [];
	intervalUpdateProgressBar: NodeJS.Timeout | undefined;
	timeToUpdateProgressBar: number = 5000;
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
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
						.setCustomId("pause_t")
						.setLabel("Пауза")
						.setStyle(ButtonStyle.Primary)
			);
		this.actionRowModes = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("rep_s")
					.setLabel("Зациклить трек")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("rep_q")
					.setLabel("Зациклить очередь")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
						.setCustomId("shuf")
						.setLabel("Перемешать очередь")
						.setStyle(ButtonStyle.Primary)
			);
	}
	async getSong(search: string, requester: GuildMember): Promise<SongInfo | null> {
		try {
			const request = this.isUrl(search) ? search : `ytsearch:${search}`;
			const node = this.client.slashCommandModule.managerLavalink.idealNodes[0];
			const data = (await Rest.load(node, request)) as any;
			const songInfo: SongInfo = {
				"title": data.data[0].info.title,
				"url": data.data[0].info.uri,
				"author": data.data[0].info.author,
				"track": data.data[0].encoded,
				"length": data.data[0].info.length,
				"thumb": `https://img.youtube.com/vi/${data.data[0].info.identifier}/0.jpg`,
				"request_by": requester.id
			};
			return songInfo;
		} catch (_) {
			return null;
		}
	}
	async getPlaylistSongs(search: string, requester: GuildMember): Promise<{
		playlListName: string;
		songs: SongInfo[]
	} | null> {
		try {
			const request = this.isUrl(search) ? search : `ytsearch:${search}`;
			const node = this.client.slashCommandModule.managerLavalink.idealNodes[0];
			const data = (await Rest.load(node, request)) as any;
			if(data.loadType !== "playlist") {
				return null;
			}
			const songs: SongInfo[] = [];
			const namePlaylist = data.data.info.name;
			for(const song of data.data.tracks) {
				songs.push({
					"title": song.info.title,
					"url": song.info.uri,
					"author": song.info.author,
					"track": song.encoded,
					"length": song.info.length,
					"thumb": `https://img.youtube.com/vi/${song.info.identifier}/0.jpg`,
					"request_by": requester.id
				});
			}
			return {
				"playlListName": namePlaylist,
				"songs": songs
			};
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
	millisToMinutesAndSeconds(millis: number) {
		const minutes = Math.floor(millis / 60000);
		const seconds = Number(((millis % 60000) / 1000).toFixed(0));
		return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
	}
	generateProgressBar(): string | null {
		try {
			if(this.player!.timestamp == null) return null;
			const timeCrrent = Date.now() - this.player!.timestamp!;
			const durationTrack = this.millisToMinutesAndSeconds(this.nowPlaying!.length);
			const currentDurationTrack = this.millisToMinutesAndSeconds(timeCrrent);
			const percent = ( ( 100 * timeCrrent ) / this.nowPlaying!.length ) / 10;
			let bar = "";
			for(let i = 0; i < percent * 3 - 1; i++) {
				bar = `${bar}=`;
			}
			bar = `${bar}>`;
			for(let i = bar.length; i < 30; i++) {
				bar = `${bar} `;
			}
			const str = `\`\`[${bar}][${currentDurationTrack}/${durationTrack}]\`\``;
			return str;
		} catch (error) {
			return null;
		}
	}
	generateTrackEmbed(songInfo: SongInfo) {
		const progressBar = this.generateProgressBar();
		const embed = new EmbedBuilder()
			.setTitle(songInfo.title)
			.setDescription(`${songInfo.author}\n\n запросил: <@${songInfo.request_by}>\n\n`)
			.setURL(songInfo.url)
			.setThumbnail(songInfo.thumb);
		if(progressBar !== null) {
			embed.setDescription(`${songInfo.author}\n\n запросил: <@${songInfo.request_by}>\n\n${progressBar}`)
		}
		return embed;
	}
	async updateMainMsgForProgressBar() {
		try {
			const embed = this.generateTrackEmbed(this.nowPlaying!);
			let footerText = "Mode:"
			if (this.mode === Modes.NORMAL) footerText = `${footerText} обычный`
			if (this.mode === Modes.REPEAT) footerText = `${footerText} повтор`
			if (this.mode === Modes.REPEAT_Q) footerText = `${footerText} повтор очереди`
			embed.setFooter({
				"text": footerText
			});
			this.msg = await this.msg!.edit({
				"embeds": [embed], "components": [this.actionRow, this.actionRowModes]
			})
		} catch (_) {}
	}
	async sendEmbedPlayer(songInfo: SongInfo, interaction: ChatInputCommandInteraction): Promise<Message> {
		const embed = this.generateTrackEmbed(songInfo);
        let footerText = "Mode:"
        if (this.mode === Modes.NORMAL) footerText = `${footerText} обычный`
        if (this.mode === Modes.REPEAT) footerText = `${footerText} повтор`
		if (this.mode === Modes.REPEAT_Q) footerText = `${footerText} повтор очереди`
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
	async sendEmbedAddedPlayList(songInfo: SongInfo, playlistName: string, interaction: ChatInputCommandInteraction): Promise<Message> {
		const embed = this.generateTrackEmbed(songInfo);
		embed.setTitle(songInfo.author);
		embed.setDescription(`Плейлист \`\`${playlistName}\`\` добавлен в очередь`);
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
	async sendErrorSearchSongPlaylist(interaction: ChatInputCommandInteraction) {
		await interaction.editReply({
			"content": "Произошла ошибка в поиске плейлиста"
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
		if (this.mode === Modes.REPEAT_Q) footerText = `${footerText} повтор очереди`
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
	changeQueueAfterRepeatQueue() {
		if(this.tmpQueue !== null && this.nowPlayingTmpQueueId !== null) {
			if(this.tmpQueue.length === 1) {
				this.queue = JSON.parse(JSON.stringify(this.tmpQueue));
			} else {
				this.queue = this.tmpQueue.slice(this.nowPlayingTmpQueueId)
			}
		}
	}
	setHandlerVoiceUpdate() {
		const callback = async (oldState: VoiceState, newState: VoiceState) => {
			if(newState.member!.id === this.client.user!.id && newState.channelId === null) {
				await this.destroy();
			}
		}
		this.regCallback("voiceStateUpdate", callback)
	}
	setHandlersQueueWatcher() {
		const callback = async (uuid: string) => {
			this.queueWatchers = this.queueWatchers.filter(el => el.uuid !== uuid);
		};
		this.regCallback("ShowQueueMessageWatcherDestroy", callback);
	}
	shuffleQeue(isTmp = false){
		let _queue = isTmp ? this.tmpQueue : this.queue;
		if(_queue === null) return;
		let m = _queue.length, t, i;
		while (m) {
			i = Math.floor(Math.random() * m--);
			t = _queue[m];
			_queue[m] = _queue[i];
			_queue[i] = t;
		}
	}
	setHandlersButtons() {
		const callback = async (interaction: ButtonInteraction) => {
			if (!this.msg) return;
			if (!interaction.isButton()) return;
			if(interaction.message.id !== this.msg.id) return;
			this.lastEvent = interaction.customId;
			if(interaction.customId === PlayerButtonsEnum.SHOW_QUEUE) {
				const queueWatcher = new ShowQueueMessageWatcher(this.client, this.mode === Modes.REPEAT_Q ? this.tmpQueue! : this.queue);
				this.queueWatchers.push(queueWatcher);
				await queueWatcher.init(interaction);
				return;
			}
			if (interaction.member!.user.id !== this.member.id) {
                await interaction.reply({
					"ephemeral": true, "content": "Вы не DJ!"
				});
                return;
            }
			if (interaction.customId === PlayerButtonsEnum.SHUFFLE_QUEUE) {
				if(this.mode === Modes.REPEAT_Q) {
					this.shuffleQeue(true);
					this.nowPlayingTmpQueueId = this.tmpQueue!.length == 1 ? 0 : 1;
				}
				else this.shuffleQeue();
				await interaction.reply({
					"ephemeral": true, "content": "Перемешал очередь"
				});
				return;
			}
			if (interaction.customId === PlayerButtonsEnum.PAUSE) {
				if(this.player!.paused) {
					await this.player!.pause(false);
					const embed = this.generateTrackEmbed(this.nowPlaying!);

					let footerText = "Mode:"
					if (this.mode === Modes.NORMAL) footerText = `${footerText} обычный`
					if (this.mode === Modes.REPEAT) footerText = `${footerText} повтор`
					if (this.mode === Modes.REPEAT_Q) footerText = `${footerText} повтор очереди`
					embed.setFooter({
						"text": footerText
					});
					const msg = await interaction.deferUpdate({
						"fetchReply": true
					});
					try {
						await msg.edit({
							"embeds": [embed], "components": [this.actionRow, this.actionRowModes]
						})
					} catch (_) {}
					return;
				}
				await this.player!.pause(true);
				const embed = this.generateTrackEmbed(this.nowPlaying!);
				embed.setFooter({
					"text": "Трек на пузе"
				});
				const msg = await interaction.deferUpdate({
					"fetchReply": true
				});
				try {
					await msg.edit({
						"embeds": [embed], "components": [this.actionRow, this.actionRowModes]
					})
				} catch (_) {}
				return;
			}
			if (interaction.customId === PlayerButtonsEnum.STOP_PLAY) {
				this.isDestroy = true;
				await this.destroy();
				return;
			}
			if (interaction.customId === PlayerButtonsEnum.NEXT_TRACK) {
				if(this.queue.length === 0 && this.mode !== Modes.REPEAT_Q) this.mode = Modes.NORMAL;
				await this.player!.stop();
				await interaction.reply({
					"ephemeral": true, "content": "Играю следующий трек"
				});
				return;
			}
            if (interaction.customId === PlayerButtonsEnum.REPEAT_SONG) {
                if(this.mode === Modes.REPEAT) this.mode = Modes.NORMAL;
				else if(this.mode === Modes.REPEAT_Q) {
					this.changeQueueAfterRepeatQueue();
					this.tmpQueue = null;
					this.nowPlayingTmpQueueId = null;
					this.mode = Modes.REPEAT;
				}
                else this.mode = Modes.REPEAT;
                await this.changeSongMessage(this.nowPlaying!);
				await interaction.reply({
					"ephemeral": true, "content": "Режим воспроизведения изменен"
				});
				return;
			}
			if (interaction.customId === PlayerButtonsEnum.REPEAT_QUEUE) {
                if(this.mode === Modes.REPEAT_Q) {
					this.mode = Modes.NORMAL;
					this.changeQueueAfterRepeatQueue();
					this.tmpQueue = null;
					this.nowPlayingTmpQueueId = null;	
				}
                else {
					this.mode = Modes.REPEAT_Q;
					this.tmpQueue = [];
					this.tmpQueue.push(this.nowPlaying!);
					(JSON.parse(JSON.stringify(this.queue)) as SongInfo[]).forEach(el => {
						this.tmpQueue!.push(el);
					});
					this.nowPlayingTmpQueueId = 1;
				}
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
			if (this.queue.length === 0 && this.mode === Modes.NORMAL) {
				await this.destroy();
				return;
			}
			let song = this.nowPlaying! // если мод повтор то берем прошлый трек который играл что его снова играть
            if((this.mode === Modes.NORMAL || this.lastEvent === "next_t") && this.mode !== Modes.REPEAT_Q) {
                song = this.queue.shift()!;
                this.nowPlaying = song;
                this.lastEvent = null;
            }
			if(this.mode === Modes.REPEAT_Q) {
				if(this.tmpQueue !== null && this.nowPlayingTmpQueueId !== null) {
					if(this.nowPlayingTmpQueueId > this.tmpQueue.length - 1) {
						this.nowPlayingTmpQueueId = 0;
					}
					song = this.tmpQueue[this.nowPlayingTmpQueueId];
					this.nowPlaying = song;
					this.nowPlayingTmpQueueId += 1;
				}
			}
			await this.changeSongMessage(song);
			await this.player!.play(song.track);
		});
	}
	async addSong(interaction: ChatInputCommandInteraction, isPlayList = false) {
		await interaction.deferReply();
		const member = await interaction.guild!.members.fetch(interaction.member!.user.id);
		if(member.voice.channelId !== this.voiceChannelId) {
			await this.sendErrorAddSong(interaction);
			return;
		}
		const option = interaction.options.getString("request")!;
		let playlistName: string | null = null;
		let playListongs: SongInfo[] | null = null;
			let song: SongInfo | null = null;
			if(isPlayList) {
				const playlist = await this.getPlaylistSongs(option, member);
				if(!playlist) {
					await this.sendErrorSearchSong(interaction);
					return;
				}
				playListongs = playlist!.songs;
				playlistName = playlist.playlListName;
				song = playListongs[0];
				playListongs.forEach(el => this.queue.push(el));
				if(this.mode === Modes.REPEAT_Q) playListongs.forEach(el => this.tmpQueue!.push(el));
			} else {
				song = await this.getSong(option, member);
			}
		if (!song) {
			await this.sendErrorSearchSong(interaction);
			return;
		}
		let msg: Message | null = null;
		if(isPlayList) {
			msg = await this.sendEmbedAddedPlayList(song, playlistName!, interaction);
		} else {
			msg = await this.sendEmbedAddedSong(song, interaction);
			this.queue.push(song);
			if(this.mode === Modes.REPEAT_Q) this.tmpQueue!.push(song);
		}
		
		deleteMsgAfterTimeout(msg, 7000);
	}
	async destroy() {
		MusicPlayer.instances.delete(this.interaction.guild!.id);
		clearInterval(this.intervalUpdateProgressBar);
		try {
			this.player!.removeAllListeners("end");
		} catch (_) {}
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
		for(const queueWatcher of this.queueWatchers) {
			await queueWatcher.destroy();
		}
		this.destroyCallbacks();
	}
	async init(isPlayList = false) {
		try {
			if(MusicPlayer.instances.has(this.interaction.guild!.id)) throw new Error(`The player has already been created for this guild ( ${this.interaction.guild!.id} )`);
			MusicPlayer.instances.set(this.interaction.guild!.id, this);
			await this.interaction.deferReply();
			this.setHandlersButtons();
			const option = this.interaction.options.getString("request")!;
			let playListongs: SongInfo[] | null = null;
			let song: SongInfo | null = null;
			if(isPlayList) {
				const playlist = await this.getPlaylistSongs(option, this.member);
				if(!playlist) {
					await this.sendErrorSearchSongPlaylist(this.interaction);
					await this.destroy();
					return;
				}
				playListongs = playlist.songs;
				song = playListongs[0];
				for(let i = 1; i < playListongs.length; i++) {
					this.queue.push(playListongs[i])
				}
			} else {
				song = await this.getSong(option, this.member);
			}
			if (!song) {
				await this.sendErrorSearchSong(this.interaction);
				await this.destroy();
				return;
			}
			this.nowPlaying = song;
			await this.createPlayer();
			this.setHandlersPlayer();
			await this.player!.play(song.track);
			await this.sendEmbedPlayer(song!, this.interaction);
			this.intervalUpdateProgressBar = setInterval(async () => {
				await this.updateMainMsgForProgressBar();
			}, this.timeToUpdateProgressBar);
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