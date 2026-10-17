export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  swiftCode?: string;
}

export const SUPPORTED_ETHIOPIAN_BANKS: BankAccountInfo[] = [
  {
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    accountNumber: '1000234567891',
    accountName: 'WholesaleHub Ethiopia Commercial Escrow',
    branch: 'Addis Ababa Main Branch',
  },
  {
    bankName: 'Awash International Bank',
    accountNumber: '01304567891000',
    accountName: 'WholesaleHub Ethiopia Trading PLC',
    branch: 'Bole Medhanialem',
  },
  {
    bankName: 'Dashen Bank',
    accountNumber: '5012345678901',
    accountName: 'WholesaleHub Ethiopia Trading PLC',
    branch: 'Kazanchis Main Branch',
  },
  {
    bankName: 'Bank of Abyssinia (BOA)',
    accountNumber: '8901234567001',
    accountName: 'WholesaleHub Ethiopia Trading PLC',
    branch: 'Churchill Road Branch',
  },
];

export class BankTransferAdapter {
  public getDepositAccounts(): BankAccountInfo[] {
    return SUPPORTED_ETHIOPIAN_BANKS;
  }

  public validateReference(reference: string): boolean {
    // Reference should be at least 5 alphanumeric characters
    return typeof reference === 'string' && reference.trim().length >= 5;
  }
}

export const bankTransferAdapter = new BankTransferAdapter();
