import { Account, Currency, WalletAPIClient, WindowMessageTransport } from '@ledgerhq/wallet-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
const USER_SOL_ADDRESS_QUERY_KEY = 'userSolAddress'
const LIST_CURRENCY_KEY = 'listCurrency'

// outside the component
let transport: any

if (typeof window === 'undefined') {
  transport = {
    onMessage: undefined,
    send: () => {},
  }
} else {
  transport = new WindowMessageTransport()
  transport.connect()
}

const fetchAddressByCurrencyId = async (walletApiSdk: WalletAPIClient | undefined | null, currencyId: string) => {
  const userAddress = await walletApiSdk?.account?.list({
    currencyIds: [currencyId],
  })

  /**
   * account balance is a big number
   * when we set favorite account in locale storage json stringify doesn't keep the bigNumber type in memory
   */

  if (!userAddress) throw new Error('Error Happen')

  if (userAddress.length > 0) return userAddress[0]

  if (userAddress.length === 0) {
    const requestUserAddress = await walletApiSdk?.account.request({
      currencyIds: [currencyId],
    })
    if (!requestUserAddress) throw new Error('Error Happen')
    return requestUserAddress
  }
  return userAddress[0]
}

const requestAddressByCurrencyId = async (walletApiSdk: WalletAPIClient | undefined | null, currencyId: string) => {
  const requestedUserAddress = await walletApiSdk?.account.request({
    currencyIds: [currencyId],
  })
  if (!requestedUserAddress) throw new Error('Error Happen')
  return requestedUserAddress
}

const useWalletApi = () => {
  const queryClient = useQueryClient()

  const { data: walletApiSdk } = useQuery({
    queryKey: ['setUpSdk'],
    queryFn: () => {
      if (walletApiSdk) return null
      const sdk = new WalletAPIClient(transport)
      return sdk
    },
    staleTime: Infinity,
  })

  const { data: listCurrency } = useQuery({
    queryKey: [LIST_CURRENCY_KEY],
    queryFn: () =>
      walletApiSdk?.currency.list({
        currencyIds: ['solana'],
      }),
    staleTime: Infinity,
    enabled: !!walletApiSdk,
  })

  const solAddressQuery = useQuery({
    queryKey: [USER_SOL_ADDRESS_QUERY_KEY],
    queryFn: () => fetchAddressByCurrencyId(walletApiSdk, 'solana'),
    enabled: false && !walletApiSdk,
  })

  const renderBalance = (account: Account | undefined): string => {
    if (!account) return '0'

    const selectedUnit = listCurrency?.find((unit: Currency) => unit.id === account?.currency)
    if (selectedUnit) {
      const decimals = selectedUnit?.decimals
      return account?.balance
        ?.dividedBy(10 ** decimals)
        .toFixed()
        .substring(0, 9)
    }
    return '0'
  }

  const { mutate: selectNewSolAccount } = useMutation({
    mutationFn: async () => requestAddressByCurrencyId(walletApiSdk, 'solana'),
    onSuccess: (requestUserAddress) => {
      queryClient.setQueriesData({ queryKey: [USER_SOL_ADDRESS_QUERY_KEY] }, requestUserAddress)
    },
  })

  return {
    solAddressQuery,
    walletApiSdk,
    listCurrency,
    selectNewSolAccount,
    renderBalance,
  }
}

export default useWalletApi
