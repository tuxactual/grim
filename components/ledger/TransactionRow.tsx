import { LedgerFeedbackRow } from "./LedgerFeedbackRow";
import type { Transaction } from "@/types/transaction";

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  return <LedgerFeedbackRow transaction={transaction} isNew={false} />;
}
