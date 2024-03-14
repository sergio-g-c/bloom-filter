import { createHash, getHashes } from "crypto";

/**
 * @source https://samwho.dev/bloom-filters/
 * @param expectedItems
 * @param falsePositiveRate
 * @returns
 */
function bits(expectedItems: number, falsePositiveRate: number): number {
  const n = -expectedItems * Math.log(falsePositiveRate);
  const d = Math.log(2) ** 2;
  return Math.ceil(n / d);
}

/**
 * @source https://samwho.dev/bloom-filters/
 * @param bits
 * @param maxItems
 * @returns
 */
function hashFunctions(bits: number, maxItems: number): number {
  return Math.ceil((bits / maxItems) * Math.log(2));
}

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const isHashingAlgorithmSupported = (hashingAlgorithm: string): boolean =>
  getHashes().includes(hashingAlgorithm);

interface Options {
  expectedItems?: number;
  maxItems?: number;
  desiredFalsePositiveRate?: number;
  hashingAlgorithm?: string;
}

export default class BloomFilter {
  private hashingAlgorithm: string;
  private filter: Set<number> = new Set();
  public readonly expectedItems: number;
  public readonly numberOfFunctions: number;
  public readonly maxItems: number;

  constructor({
    expectedItems,
    maxItems,
    desiredFalsePositiveRate,
    hashingAlgorithm
  }: Options = {}) {
    this.hashingAlgorithm = hashingAlgorithm ?? "sha1";
    assertTrue(
      isHashingAlgorithmSupported(this.hashingAlgorithm),
      `Algorithm not supported ${this.hashingAlgorithm}`
    );
    this.expectedItems = expectedItems ?? 100;
    this.maxItems = maxItems ?? this.expectedItems * 5;
    this.numberOfFunctions = hashFunctions(
      bits(this.expectedItems, desiredFalsePositiveRate ?? 0.01),
      this.maxItems
    );
  }

  private digest(str: string, salt: string): Buffer {
    const hash = createHash(this.hashingAlgorithm);
    const saltDigest = createHash(this.hashingAlgorithm)
      .update(salt, "utf8")
      .digest("hex");
    return hash.update(str).update(saltDigest).digest();
  }

  private calculateItems(str: string): Array<number> {
    const items = [];
    for (let i = 0; i < this.numberOfFunctions; i++) {
      items.push(this.digest(str, i.toString()).readUInt32BE() % this.maxItems);
    }
    return items;
  }

  public add(str: string): void {
    this.calculateItems(str).forEach((item) => this.filter.add(item));
  }

  public contains(str: string): boolean {
    return this.calculateItems(str).some((item) => this.filter.has(item));
  }
}
