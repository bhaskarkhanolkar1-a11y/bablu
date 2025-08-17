// FILE: types/discord-webhook-node.d.ts

declare module "discord-webhook-node" {
  export class Webhook {
    constructor(url: string);
    public setUsername(username: string): this;
    public setAvatar(avatarUrl: string): this;
    public send(
      content: string | MessageBuilder
    ): Promise<void>;
  }

  export class MessageBuilder {
    constructor();
    public setTitle(title: string): this;
    public setDescription(description: string): this;
    public setURL(url: string): this;
    public setColor(color: number): this;
    public setAuthor(
      name: string,
      iconURL?: string,
      url?: string
    ): this;
    public addField(
      name: string,
      value: string,
      inline?: boolean
    ): this;
    public setThumbnail(url: string): this;
    public setImage(url: string): this;
    public setFooter(
      text: string,
      iconURL?: string
    ): this;
    public setTimestamp(date?: Date): this;
    public build(): any;
  }
}
