export interface P21Output {
  write(text: string): void;
  writeLine(text: string): void;
  toString(): string;
}

export class StringBufferOutput implements P21Output {
  private readonly chunks: string[] = [];

  write(text: string): void {
    this.chunks.push(text);
  }

  writeLine(text: string): void {
    this.chunks.push(text + '\n');
  }

  toString(): string {
    return this.chunks.join('');
  }
}
