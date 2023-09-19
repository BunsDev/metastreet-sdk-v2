import { MerkleTree } from '../src';

import { keccak256 } from 'ethereum-cryptography/keccak';

const TEST_MERKLE_METADATA_1 = {
  version: 1,
  type: 'MerkleCollectionCollateralFilter',
  tokenIds: ['1', '2', '3', '42'],
};

const TEST_MERKLE_METADATA_2 = {
  version: 1,
  type: 'MerkleCollectionCollateralFilter',
  tokenIds: ['3', '5', '7', '9', '42'],
};

describe('MerkleTree', function () {
  it('constructor', function () {
    expect(() => {
      new MerkleTree(TEST_MERKLE_METADATA_1);
    }).not.toThrow();
    expect(() => {
      new MerkleTree(TEST_MERKLE_METADATA_2);
    }).not.toThrow();
    expect(() => {
      new MerkleTree({ ...TEST_MERKLE_METADATA_1, version: 2 });
    }).toThrow(/Unsupported merkle metadata version/);
    expect(() => {
      new MerkleTree({ ...TEST_MERKLE_METADATA_1, type: 'foobar' });
    }).toThrow(/Unsupported merkle metadata type/);
  });

  it('#root', function () {
    const mt1 = new MerkleTree(TEST_MERKLE_METADATA_1);
    expect(mt1.root).toEqual('0xa244b27051cd26436389f0b8eafef6ed69c56c30179e11f44b486d4826f1d2bf');

    const mt2 = new MerkleTree(TEST_MERKLE_METADATA_2);
    expect(mt2.root).toEqual('0x461a89852b9740618e6874fab08555714c267d504c83d6b3c77b9629f8b56e56');
  });

  it('#generate', function () {
    const mt1 = new MerkleTree(TEST_MERKLE_METADATA_1);
    expect(mt1.generate(1n)).toEqual(
        [
          '0x964765235251d0e2eacfbc25925d5539789c191c5cd588419591a110da2046c3',
          '0x673620737675e2755ce8269a99904022d15da8d5843f5aec205cd243ff80240a',
        ]
    );
    expect(mt1.generate(2n)).toEqual(
        [
          '0x2584db4a68aa8b172f70bc04e2e74541617c003374de6eb4b295e823e5beab01',
          '0xd5f5475a3d1329c75404746e69b8b9c17177ac59dc59c1ef9cb2825c6635fbc0',
        ]
    );
    expect(mt1.generate(3n)).toEqual(
        [
          '0x1ab0c6948a275349ae45a06aad66a8bd65ac18074615d53676c09b67809099e0',
          '0xd5f5475a3d1329c75404746e69b8b9c17177ac59dc59c1ef9cb2825c6635fbc0',
        ]
    );
    expect(mt1.generate(42n)).toEqual(
        [
          '0xb5d9d894133a730aa651ef62d26b0ffa846233c74177a591a4a896adfda97d22',
          '0x673620737675e2755ce8269a99904022d15da8d5843f5aec205cd243ff80240a',
        ]
    );
    expect(() => mt1.generate(123n)).toThrow(/Unknown Token ID/);

    const mt2 = new MerkleTree(TEST_MERKLE_METADATA_2);
    expect(mt2.generate(3n)).toEqual(
        [
          '0x16db2e4b9f8dc120de98f8491964203ba76de27b27b29c2d25f85a325cd37477',
          '0xaef723aaf2a9471d0444688035cd22ee9e9408f4d3390ce0a2a80b76aeab390a',
          '0x8a77d134ce8480f4f70030d36b94b824c9abd76f520d2d9778cf9d6b365fe6a0',
        ]
    );
    expect(mt2.generate(5n)).toEqual(
        [
          '0x2584db4a68aa8b172f70bc04e2e74541617c003374de6eb4b295e823e5beab01',
          '0xaef723aaf2a9471d0444688035cd22ee9e9408f4d3390ce0a2a80b76aeab390a',
          '0x8a77d134ce8480f4f70030d36b94b824c9abd76f520d2d9778cf9d6b365fe6a0',
        ]
    );
    expect(mt2.generate(7n)).toEqual(
        [
          '0x964765235251d0e2eacfbc25925d5539789c191c5cd588419591a110da2046c3',
          '0xe556942d5e277b33b44e308f08493cfaea8ae675ec520b92209e8a07eb9325eb',
        ]
    );
    expect(mt2.generate(9n)).toEqual(
        [
          '0x64db0af4e3097c2974bf8abb17133c058f2076a7074b7aecfa02f9a04f6ccfa0',
          '0x8a77d134ce8480f4f70030d36b94b824c9abd76f520d2d9778cf9d6b365fe6a0',
        ]
    );
    expect(mt2.generate(42n)).toEqual(
        [
          '0x607bca8f7c1c56da874da29cd62c3769b9880d38a258a91fc6dd1cfb6b4d1a8e',
          '0xe556942d5e277b33b44e308f08493cfaea8ae675ec520b92209e8a07eb9325eb',
        ]
    );
    expect(() => mt2.generate(123n)).toThrow(/Unknown Token ID/);
  });

  it('#validate', function () {
    const mt1 = new MerkleTree(TEST_MERKLE_METADATA_1);
    expect(
      mt1.validate(
        1n,
        [
          '0x964765235251d0e2eacfbc25925d5539789c191c5cd588419591a110da2046c3',
          '0x673620737675e2755ce8269a99904022d15da8d5843f5aec205cd243ff80240a',
        ]
      ),
    ).toBe(true);
    expect(
      mt1.validate(
        2n,
        [
          '0x2584db4a68aa8b172f70bc04e2e74541617c003374de6eb4b295e823e5beab01',
          '0xd5f5475a3d1329c75404746e69b8b9c17177ac59dc59c1ef9cb2825c6635fbc0',
        ]
      ),
    ).toBe(true);
    expect(
      mt1.validate(
        3n,
        [
          '0x1ab0c6948a275349ae45a06aad66a8bd65ac18074615d53676c09b67809099e0',
          '0xd5f5475a3d1329c75404746e69b8b9c17177ac59dc59c1ef9cb2825c6635fbc0',
        ],
      ),
    ).toBe(true);
    expect(
      mt1.validate(
        42n,
        [
          '0xb5d9d894133a730aa651ef62d26b0ffa846233c74177a591a4a896adfda97d22',
          '0x673620737675e2755ce8269a99904022d15da8d5843f5aec205cd243ff80240a',
        ],
      ),
    ).toBe(true);
    expect(
      mt1.validate(
        2n,
        [
          '0xb5d9d894133a730aa651ef62d26b0ffa846233c74177a591a4a896adfda97d22',
          '0x673620737675e2755ce8269a99904022d15da8d5843f5aec205cd243ff80240a',
        ],
      ),
    ).toBe(false);

    const mt2 = new MerkleTree(TEST_MERKLE_METADATA_2);
    expect(
      mt2.validate(
        3n,
        [
          '0x16db2e4b9f8dc120de98f8491964203ba76de27b27b29c2d25f85a325cd37477',
          '0xaef723aaf2a9471d0444688035cd22ee9e9408f4d3390ce0a2a80b76aeab390a',
          '0x8a77d134ce8480f4f70030d36b94b824c9abd76f520d2d9778cf9d6b365fe6a0',
        ],
      ),
    ).toBe(true);
    expect(
      mt2.validate(
        5n,
        [
          '0x2584db4a68aa8b172f70bc04e2e74541617c003374de6eb4b295e823e5beab01',
          '0xaef723aaf2a9471d0444688035cd22ee9e9408f4d3390ce0a2a80b76aeab390a',
          '0x8a77d134ce8480f4f70030d36b94b824c9abd76f520d2d9778cf9d6b365fe6a0',
        ],
      ),
    ).toBe(true);
    expect(
      mt2.validate(
        7n,
        [
          '0x964765235251d0e2eacfbc25925d5539789c191c5cd588419591a110da2046c3',
          '0xe556942d5e277b33b44e308f08493cfaea8ae675ec520b92209e8a07eb9325eb',
        ],
      ),
    ).toBe(true);
    expect(
      mt2.validate(
        9n,
        [
          '0x64db0af4e3097c2974bf8abb17133c058f2076a7074b7aecfa02f9a04f6ccfa0',
          '0x8a77d134ce8480f4f70030d36b94b824c9abd76f520d2d9778cf9d6b365fe6a0',
        ],
      ),
    ).toBe(true);
    expect(
      mt2.validate(
        42n,
        [
          '0x607bca8f7c1c56da874da29cd62c3769b9880d38a258a91fc6dd1cfb6b4d1a8e',
          '0xe556942d5e277b33b44e308f08493cfaea8ae675ec520b92209e8a07eb9325eb',
        ],
      ),
    ).toBe(true);
    expect(
      mt2.validate(
        5n,
        [
          '0x607bca8f7c1c56da874da29cd62c3769b9880d38a258a91fc6dd1cfb6b4d1a8e',
          '0xe556942d5e277b33b44e308f08493cfaea8ae675ec520b92209e8a07eb9325eb',
        ],
      ),
    ).toBe(false);
  });

  it('#generate,validate', function () {
    const mt1 = new MerkleTree(TEST_MERKLE_METADATA_1);
    expect(mt1.validate(1n, mt1.generate(1n))).toBe(true);
    expect(mt1.validate(2n, mt1.generate(2n))).toBe(true);
    expect(mt1.validate(3n, mt1.generate(3n))).toBe(true);
    expect(mt1.validate(42n, mt1.generate(42n))).toBe(true);

    const mt2 = new MerkleTree(TEST_MERKLE_METADATA_2);
    expect(mt2.validate(3n, mt2.generate(3n))).toBe(true);
    expect(mt2.validate(5n, mt2.generate(5n))).toBe(true);
    expect(mt2.validate(7n, mt2.generate(7n))).toBe(true);
    expect(mt2.validate(9n, mt2.generate(9n))).toBe(true);
    expect(mt2.validate(42n, mt2.generate(42n))).toBe(true);
  });
});
