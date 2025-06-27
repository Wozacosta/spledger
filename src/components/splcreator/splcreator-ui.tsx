import { PublicKey } from '@solana/web3.js'
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ellipsify } from '@/lib/utils'
import { useSplcreatorProgram } from './splcreator-data-access'

export function SplcreatorCreate() {
  const { create } = useSplcreatorProgram()

  return (
    <Button onClick={() => create.mutateAsync()} disabled={create.isPending}>
      Create Token {create.isPending && '...'}
    </Button>
  )
}

export function SplcreatorList() {
  const { creatorData, getProgramAccount } = useSplcreatorProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {creatorData.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : creatorData.data?.spls?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {creatorData.data.spls.map((mint: string, idx: number) => (
            <SplcreatorCard key={mint} mint={new PublicKey(mint)} idx={idx} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No SPL Tokens</h2>
          No tokens found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function SplcreatorCard({ mint, idx }: { mint: PublicKey; idx: number }) {
  const { creatorData } = useSplcreatorProgram()
  const name = creatorData.data?.names[idx] ?? 'Unknown'
  const symbol = creatorData.data?.symbols[idx] ?? ''
  const uri = creatorData.data?.uris[idx] ?? ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {name} ({symbol})
        </CardTitle>
        <CardDescription>
          Mint: <ExplorerLink path={`account/${mint}`} label={ellipsify(mint.toString())} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="truncate">URI: {uri}</p>
      </CardContent>
    </Card>
  )
}
