import { getSplcreatorProgram, getSplcreatorProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '@/components/cluster/cluster-data-access'
import { useAnchorProvider } from '@/components/solana/use-anchor-provider'
import { useTransactionToast } from '@/components/use-transaction-toast'
import { toast } from 'sonner'
import * as anchor from '@coral-xyz/anchor'

export function useSplcreatorProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getSplcreatorProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getSplcreatorProgram(provider, programId), [provider, programId])

  const creatorData = useQuery({
    queryKey: ['splcreator', 'data', { cluster }],
    queryFn: async () => {
      const [creatorPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('spl_creator'), provider.publicKey.toBuffer()],
        program.programId,
      )
      return await program.account.creatorData.fetch(creatorPda)
    },
    enabled: !!provider?.publicKey,
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const create = useMutation({
    mutationKey: ['splcreator', 'create', { cluster }],
    mutationFn: async () => {
      const payer = provider.publicKey
      const mint = Keypair.generate()
      const [creatorPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('spl_creator'), payer.toBuffer()],
        program.programId,
      )
      const ata = await (await import('@solana/spl-token')).getAssociatedTokenAddress(mint.publicKey, payer)

      const name = 'MyToken'
      const symbol = 'TOK'
      const uri = 'https://example.com/token.json'

      const tx = await program.methods
        .create(name, symbol, uri)
        .accounts({
          payer,
          mint: mint.publicKey,
          userAta: ata,
          creatorData: creatorPda,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: (await import('@solana/spl-token')).TOKEN_PROGRAM_ID,
          associatedTokenProgram: (await import('@solana/spl-token')).ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mint])
        .rpc()

      transactionToast(tx)
      await creatorData.refetch()
      return tx
    },
    onError: () => {
      toast.error('Failed to create token')
    },
  })

  return {
    program,
    programId,
    creatorData,
    getProgramAccount,
    create,
  }
}
