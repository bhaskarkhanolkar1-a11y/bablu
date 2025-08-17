// FILE: lib/notifications.ts

import nodemailer from "nodemailer";
import { IncomingWebhook } from "@slack/webhook";
import { Webhook, MessageBuilder } from "discord-webhook-node";

const LOW_STOCK_THRESHOLD = 5;

// --- Email Configuration ---
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_SERVER_USER,
		pass: process.env.EMAIL_SERVER_PASSWORD,
	},
});

// --- Slack Configuration ---
const slackWebhook = process.env.SLACK_WEBHOOK_URL
	? new IncomingWebhook(process.env.SLACK_WEBHOOK_URL)
	: null;

// --- Discord Configuration ---
const discordWebhook = process.env.DISCORD_WEBHOOK_URL
	? new Webhook(process.env.DISCORD_WEBHOOK_URL)
	: null;


async function sendLowStockEmail(itemName: string, quantity: number) {
	if (!process.env.EMAIL_TO || !transporter.options.auth) return;

	try {
		await transporter.sendMail({
			from: `"Inventory Alert" <${process.env.EMAIL_SERVER_USER}>`,
			to: process.env.EMAIL_TO,
			subject: `Low Stock Alert: ${itemName}`,
			text: `The quantity for item "${itemName}" is low: only ${quantity} left in stock.`,
			html: `<p>The quantity for item "<b>${itemName}</b>" is low: only <b>${quantity}</b> left in stock.</p>`,
		});
		console.log(`Low stock email sent for ${itemName}`);
	} catch (error) {
		console.error(`Failed to send low stock email for ${itemName}:`, error);
	}
}


async function sendSlackNotification(itemName: string, quantity: number) {
	if (!slackWebhook) return;

	try {
		await slackWebhook.send({
			text: `*Low Stock Alert!*
> Item: *${itemName}*
> Quantity Remaining: *${quantity}*`,
		});
		console.log(`Low stock Slack notification sent for ${itemName}`);
	} catch (error) {
		console.error(`Failed to send Slack notification for ${itemName}:`, error);
	}
}


async function sendDiscordNotification(itemName: string, quantity: number) {
	if (!discordWebhook) return;

	try {
		const embed = new MessageBuilder()
			.setTitle("🚨 Low Stock Alert")
			.addField("Item Name", itemName)
			.addField("Quantity Remaining", String(quantity), true)
			.setColor(0xffa500) // Orange color
			.setTimestamp();

		await discordWebhook.send(embed);
		console.log(`Low stock Discord notification sent for ${itemName}`);
	} catch (error) {
		console.error(`Failed to send Discord notification for ${itemName}:`, error);
	}
}


export async function handleLowStockNotification(
	itemName: string,
	oldQuantity: number,
	newQuantity: number
) {
	// Trigger notification only when the quantity crosses the threshold
	if (newQuantity <= LOW_STOCK_THRESHOLD && oldQuantity > LOW_STOCK_THRESHOLD) {
		console.log(`Item ${itemName} is low on stock (${newQuantity}). Triggering notifications.`);
		// Fire and forget - no need to wait for these to complete
		sendLowStockEmail(itemName, newQuantity);
		sendSlackNotification(itemName, newQuantity);
		sendDiscordNotification(itemName, newQuantity);
	}
}
