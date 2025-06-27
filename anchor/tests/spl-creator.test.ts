// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { SplCreator } from "../target/types/spl_creator";

// describe("spl-creator", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace.splCreator as Program<SplCreator>;

//   it("Is initialized!", async () => {
//     // Add your test here.
//     const tx = await program.methods.initialize().rpc();
//     console.log("Your transaction signature", tx);
//   });
// });

import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { SplCreator } from '../target/types/spl_creator'
import {
  createMint,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  mintTo,
} from '@solana/spl-token'
import { assert } from 'chai'

describe('spl_creator', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.SplCreator as Program<SplCreator>
  const payer = provider.wallet

  let mint = anchor.web3.Keypair.generate()
  let creatorDataPDA: anchor.web3.PublicKey
  let bump: number
  let ata: anchor.web3.PublicKey

  const name = 'Token Name'
  const symbol = 'SYM'
  const uri = 'https://example.com/metadata.json'

  it('creates a new SPL token and stores metadata', async () => {
    // Derive PDA
    ;[creatorDataPDA, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('spl_creator'), payer.publicKey.toBuffer()],
      program.programId,
    )

    ata = await getAssociatedTokenAddress(mint.publicKey, payer.publicKey)

    await program.methods
      .create(name, symbol, uri)
      .accounts({
        payer: payer.publicKey,
        mint: mint.publicKey,
        userAta: ata,
        creatorData: creatorDataPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      // .preInstructions([
      //   await program.account.creatorData.createInstruction(mint)
      //   // await program.account.mint.createInstruction(mint),
      // ])
      .rpc()

    // Check token was minted
    const tokenAccount = await getAccount(provider.connection, ata)
    assert.strictEqual(Number(tokenAccount.amount), 1)

    // Fetch creator data
    const creatorData = await program.account.creatorData.fetch(creatorDataPDA)

    assert.strictEqual(creatorData.spls.length, 1)
    assert.strictEqual(creatorData.names[0], name)
    assert.strictEqual(creatorData.symbols[0], symbol)
    assert.strictEqual(creatorData.uris[0], uri)
  })

  it('logs mints via list instruction', async () => {
    const tx = await program.methods
      .list()
      .accounts({
        payer: payer.publicKey,
        creatorData: creatorDataPDA,
      })
      .rpc()

    console.log('List transaction:', tx)
  })
})
