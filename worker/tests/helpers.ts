export class MemoryKV {
  private readonly values = new Map<string, string>();

  async get(key: string, type?: 'json'): Promise<unknown> {
    const value = this.values.get(key);
    if (value === undefined) return null;
    return type === 'json' ? JSON.parse(value) : value;
  }

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}
