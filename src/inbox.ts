/** Holds what a connection hears until someone listens. */
export class Inbox {
	private held: string[] | null = [];
	private ended = false;
	private onmessage: (text: string) => void = () => {};
	private onclose: () => void = () => {};

	listen(onmessage: (text: string) => void, onclose: () => void): void {
		this.onmessage = onmessage;
		this.onclose = onclose;
		const held = this.held ?? [];
		this.held = null;
		for (const text of held) onmessage(text);
		if (this.ended) onclose();
	}

	message(text: string): void {
		if (this.held) this.held.push(text);
		else this.onmessage(text);
	}

	close(): void {
		if (this.ended) return;
		this.ended = true;
		if (!this.held) this.onclose();
	}
}
