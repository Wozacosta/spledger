import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import SplCreatorIDL from '../target/idl/spl_creator.json'
import type { SplCreator } from '../target/types/spl_creator'

// Re-export the generated IDL and type
export { SplCreator, SplCreatorIDL }

// The programId is imported from the IDL metadata
export const SPLCREATOR_PROGRAM_ID = new PublicKey(SplCreatorIDL.address)

// Returns a typed Anchor Program instance
export function getSplcreatorProgram(provider: AnchorProvider, address?: PublicKey): Program<SplCreator> {
  return new Program(
    { ...SplCreatorIDL, address: address ? address.toBase58() : SplCreatorIDL.address } as any,
    provider,
  )
}

// Resolve program ID based on the cluster
export function getSplcreatorProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      return new PublicKey('As3mFZdA1Ed7rZ3X3S8KQXU6oERs7QqLk85tDqCWTLDU')
    case 'mainnet-beta':
    default:
      return SPLCREATOR_PROGRAM_ID
  }
}
