import { colors } from '@/lib/colors';

export type ListingStatus = 'SELL_TRADE' | 'FOR_SALE' | 'FOR_TRADE' | 'NFST';

export interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const STATUS_CONFIG: Record<ListingStatus, StatusConfig> = {
  FOR_SALE: {
    label: 'FOR SALE',
    bgColor: colors.statusSale + '20',
    textColor: colors.statusSale,
    borderColor: colors.statusSale + '30',
  },
  FOR_TRADE: {
    label: 'FOR TRADE',
    bgColor: colors.statusTrade + '20',
    textColor: colors.statusTrade,
    borderColor: colors.statusTrade + '30',
  },
  SELL_TRADE: {
    label: 'SELL + TRADE',
    bgColor: colors.statusSellTrade + '20',
    textColor: colors.statusSellTrade,
    borderColor: colors.statusSellTrade + '30',
  },
  NFST: {
    label: 'NFST',
    bgColor: colors.statusNfst + '20',
    textColor: colors.statusNfst,
    borderColor: colors.statusNfst + '30',
  },
};

export function getStatusConfig(status: ListingStatus): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.NFST;
}
