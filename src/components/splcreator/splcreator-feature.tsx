import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { AppHero } from '@/components/app-hero'
import { ellipsify } from '@/lib/utils'
import { useSplcreatorProgram } from './splcreator-data-access'
import { SplcreatorCreate, SplcreatorList } from './splcreator-ui'

export default function SplcreatorFeature() {
  const { publicKey } = useWallet()
  const { programId } = useSplcreatorProgram()

  return publicKey ? (
    <div>
      <AppHero
        title="SPL Creator"
        subtitle="Create a new SPL token mint with metadata stored on-chain. The token is minted to your wallet and tracked by the program."
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <SplcreatorCreate />
      </AppHero>
      <SplcreatorList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
