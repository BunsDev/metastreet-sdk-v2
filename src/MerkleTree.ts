import { keccak256 } from 'ethereum-cryptography/keccak';
import { concatBytes, bytesToHex, hexToBytes } from 'ethereum-cryptography/utils';

export interface MerkleMetadata {
  version: number;
  type: string;
  tokenIds: string[];
}

export class MerkleTree {
  readonly metadata: MerkleMetadata;
  readonly tree: Uint8Array[];

  /****************************************************************************/
  /* Constructor */
  /****************************************************************************/

  /**
   * Constructor
   * @param metadata Merkle tree metadata
   */
  constructor(metadata: MerkleMetadata) {
    if (metadata.version != 1)
      throw new Error(`Unsupported merkle metadata version: got ${metadata.version}, expected 1`);
    if (metadata.type != 'MerkleCollectionCollateralFilter')
      throw new Error(
        `Unsupported merkle metadata type: got "${metadata.type}", expected "MerkleCollectionCollateralFilter"`,
      );

    this.metadata = metadata;
    this.tree = this._tree();
  }

  /****************************************************************************/
  /* Internal Helpers */
  /****************************************************************************/

  static _bigintToBytes(x: bigint): Uint8Array {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = Number((x >> BigInt((31 - i) * 8)) & 0xffn);
    }
    return bytes;
  }

  static _compare(a: Uint8Array, b: Uint8Array): number {
    for (let i = 0; i < a.length; i++) {
      if (a[i] == b[i]) continue;
      return a[i] < b[i] ? -1 : 1;
    }
    return 0;
  }

  static _hash(a: Uint8Array, b: Uint8Array): Uint8Array {
    return MerkleTree._compare(a, b) < 0 ? keccak256(concatBytes(a, b)) : keccak256(concatBytes(b, a));
  }

  /****************************************************************************/
  /* Tree Generation */
  /****************************************************************************/

  _tree(): Uint8Array[] {
    /* Generate leaves by converting token IDs to bigint, double hashing, and sorting */
    const tree = this.metadata.tokenIds
      .map((x) => keccak256(keccak256(MerkleTree._bigintToBytes(BigInt(x)))))
      .sort(MerkleTree._compare)
      .reverse();

    /* Generate nodes */
    for (let i = 0; i < this.metadata.tokenIds.length - 1; i++) {
      tree.unshift(MerkleTree._hash(tree[tree.length - 2 * i - 2], tree[tree.length - 2 * i - 1]));
    }

    return tree;
  }

  /****************************************************************************/
  /* Public API */
  /****************************************************************************/

  /**
   * Get merkle root
   * @return Merkle root as hex string
   */
  get root(): string {
    return '0x' + bytesToHex(this.tree[0]);
  }

  /**
   * Generate proof
   * @param tokenId Token ID
   * @return Proof byte strings
   */
  generate(tokenId: bigint): string[] {
    /* Find leaf index */
    const leaf = keccak256(keccak256(MerkleTree._bigintToBytes(tokenId)));
    /* FIXME use findLastIndex() or a leaf-to-index mapping */
    let index = this.tree.findIndex(x => MerkleTree._compare(x, leaf) === 0);
    if (index == -1) throw Error(`Unknown Token ID`);

    /* Collect siblings up the tree */
    const proof = [];
    while (index != 0) {
        proof.push("0x" + bytesToHex(this.tree[((index + 1) ^ 1) - 1]));
        index = Math.floor((index - 1) / 2);
    }

    return proof;
  }

  /**
   * Validate proof
   * @param tokenId Token ID
   * @param proof Proof byte strings
   * @return True if valid, otherwise false
   */
  validate(tokenId: bigint, proof: string[]): boolean {
    const leaf = keccak256(keccak256(MerkleTree._bigintToBytes(tokenId)));
    return MerkleTree._compare(proof.map(hexToBytes).reduce(MerkleTree._hash, leaf), this.tree[0]) === 0;
  }
}
