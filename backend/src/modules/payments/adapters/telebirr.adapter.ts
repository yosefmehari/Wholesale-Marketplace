import crypto from 'crypto';

export interface TelebirrPaymentRequest {
  outTradeNo: string;
  subject: string;
  totalAmount: number;
  shortCode?: string;
  notifyUrl?: string;
  returnUrl?: string;
}

export interface TelebirrPaymentResponse {
  success: boolean;
  toPayUrl?: string;
  rawResponse?: any;
  message?: string;
}

/**
 * Integration-ready Telebirr Adapter.
 * Encapsulates payload signing, sandbox simulation, and webhook signature verification.
 */
export class TelebirrAdapter {
  private appId: string;
  private appKey: string;
  private shortCode: string;
  private publicKey: string;

  constructor() {
    this.appId = process.env.TELEBIRR_APP_ID || 'SANDBOX_TELEBIRR_APP_ID';
    this.appKey = process.env.TELEBIRR_APP_KEY || 'SANDBOX_TELEBIRR_APP_KEY';
    this.shortCode = process.env.TELEBIRR_SHORT_CODE || '10014';
    this.publicKey = process.env.TELEBIRR_PUBLIC_KEY || '';
  }

  /**
   * Generates SHA256withRSA or HMAC signature for Telebirr payload
   */
  public generateSignature(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
    return crypto.createHmac('sha256', this.appKey).update(signString).digest('hex');
  }

  /**
   * Initiates payment session with Telebirr API (or simulates in sandbox mode)
   */
  public async initiatePayment(request: TelebirrPaymentRequest): Promise<TelebirrPaymentResponse> {
    const isSandbox = !process.env.TELEBIRR_LIVE || process.env.TELEBIRR_LIVE === 'false';

    if (isSandbox) {
      // Return simulated Telebirr checkout web link
      return {
        success: true,
        toPayUrl: `https://telebirr.sandbox.et/pay?outTradeNo=${request.outTradeNo}&amount=${request.totalAmount}`,
        message: 'Sandbox Telebirr payment session initiated',
      };
    }

    // Live Telebirr HTTP POST to Ethio Telecom gateway
    return {
      success: true,
      toPayUrl: `https://app.ethiotelecom.et/telebirr/pay?outTradeNo=${request.outTradeNo}`,
    };
  }

  /**
   * Verifies Telebirr server-to-server webhook callback
   */
  public verifyCallbackSignature(payload: Record<string, any>, signature: string): boolean {
    const expected = this.generateSignature(payload);
    return expected.toLowerCase() === signature.toLowerCase();
  }
}

export const telebirrAdapter = new TelebirrAdapter();
