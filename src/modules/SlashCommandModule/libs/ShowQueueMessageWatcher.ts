import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message } from "discord.js";
import { BotCLient } from "../../../Client";
import { BaseCallbackWatcher } from "../../../baseClasses/BaseCallbackWatcher";
import { SongInfo } from "./types";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
enum QeueButtonsEnum {
    "NEXT_P" = "nextp",
    "PREV_P" = "prevp"
}
export class ShowQueueMessageWatcher extends BaseCallbackWatcher {
	limitPerPage: number = 15;
	autoDeleteTimer: number = 5 * 60 * 1000;
	pages: number;
	songs: SongInfo[];
	currentPage: number = 0;
	msg: Message | null = null;
	member: GuildMember | null = null;
	actionRow: ActionRowBuilder<ButtonBuilder>;
	constructor(client: BotCLient, songs: SongInfo[]) {
		super(client);
		this.songs = songs;
		this.pages = Math.ceil(this.songs.length / this.limitPerPage);
		this.actionRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("prevp")
					.setLabel("Назад")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("nextp")
					.setLabel("Вперед")
					.setStyle(ButtonStyle.Primary)
			);
	}
	autoDelete(ms: number) {
		setTimeout(async () => {
			this.destroy();
			try {
				await this.msg!.delete();
			} catch (_) {}
		}, ms);
	}
	setHandlerMessage() {
		const callback = async (interaction: ButtonInteraction) => {
			if (!this.msg) return;
			if (!interaction.isButton()) return;
			if(interaction.message.id !== this.msg.id) return;
			if (interaction.member!.user.id !== this.member!.id) {
                await interaction.reply({
					"ephemeral": true, "content": "Вы не автор сообщения!"
				});
                return;
            }
			if (interaction.customId === QeueButtonsEnum.NEXT_P) {
				this.currentPage += 1;
			}
			if (interaction.customId === QeueButtonsEnum.PREV_P) {
				this.currentPage -= 1;
			}
			const embed = this.generateEmbed(this.currentPage);
			if(!embed) {
				await interaction.reply({
					"content": "Упс, что-то слмоалось(", "ephemeral": true
				});
				this.destroy();
				return;
			}
			const msg = await interaction.deferUpdate({
				"fetchReply": true
			})
			try {
				await msg.edit({
					"embeds": [embed], "components": [this.actionRow]
				})
			} catch (_) {}
			
			return;
		};
		this.regCallback("interactionCreate", callback);
	}
	generateEmbed(page: number) {
		const embed = new EmbedBuilder()
			.setTitle("Очередь");
		let desc = "";
		for (let i = page * this.limitPerPage; i < page * this.limitPerPage + this.limitPerPage; i++) {
			if (!this.songs[i]) {
				break;
			}
			desc = `${desc}\n[${i + 1}] [${this.songs[i].title}](${this.songs[i].url}) - <@${this.songs[i].request_by}>`;
		}
		embed.setDescription(desc === "" ? "Очередь пуста" : desc);
		embed.setFooter({
			"text": `[${page + 1}/${this.pages}]`
		})
		this.actionRow.components.forEach(el => el.setDisabled(false));
		if (desc === "") {
			this.actionRow.components.forEach(el => el.setDisabled(true));
		}
		if(page === 1) {
			this.actionRow.components[0].setDisabled(true);
		}
		if(page >= this.pages!) {
			this.actionRow.components[1].setDisabled(true);
		}
		return embed;
	}
	async destroy() {
		this.destroyCallbacks();
	}
	async init(interaction: ButtonInteraction) {
		try {
			await interaction.deferReply();
			const member = await interaction.guild!.members.fetch(interaction.member!.user.id);
			if (!member) {
				await interaction.editReply({
					"content": "Упс, не предвиденная ошибка, юзер не найден"
				});
				this.destroy();
				return;
			}
			this.member = member;
			const embed = this.generateEmbed(this.currentPage);
			this.setHandlerMessage();
			if(!embed) {
				const msg = await interaction.editReply({
					"content": "Упс, что-то слмоалось("
				});
				deleteMsgAfterTimeout(msg, 5000);
				this.destroy();
				return;
			}
			this.msg = await interaction.editReply({
				"embeds": [embed], "components": [this.actionRow]
			});
		} catch (error) {
			console.log(error)
		}
		
		this.autoDelete(this.autoDeleteTimer);
	}
}
