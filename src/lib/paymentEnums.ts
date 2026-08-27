/** Mirrors `AgendaAi.Models.Pagamento` enums (`TipoPagamento` / `StatusPagamento`). */

export const PAYMENT_STATUS = {
  Pendente: 0,
  Pago: 1,
  Cancelado: 2,
  Reembolsado: 3,
} as const;

export const PAYMENT_METHOD = {
  Dinheiro: 0,
  CartaoCredito: 1,
  Boleto: 2,
  Pix: 3,
  PixCaixa: 4,
  CartaoDebito: 5,
  TransferenciaBancaria: 6,
} as const;

export type PaymentStatusCode = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type PaymentMethodCode = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export type UiPaymentStatus = 'pendente' | 'pago' | 'cancelado' | 'reembolsado';

export function mapPaymentStatusToUi(status: number): UiPaymentStatus {
  switch (status) {
    case PAYMENT_STATUS.Pago:
      return 'pago';
    case PAYMENT_STATUS.Cancelado:
      return 'cancelado';
    case PAYMENT_STATUS.Reembolsado:
      return 'reembolsado';
    default:
      return 'pendente';
  }
}

export function getPaymentStatusLabel(status: number): string {
  switch (status) {
    case PAYMENT_STATUS.Pago:
      return 'Pago';
    case PAYMENT_STATUS.Cancelado:
      return 'Cancelado';
    case PAYMENT_STATUS.Reembolsado:
      return 'Reembolsado';
    default:
      return 'Pendente';
  }
}

export function getPaymentMethodLabel(method: number): string {
  switch (method) {
    case PAYMENT_METHOD.CartaoCredito:
      return 'Cartão de crédito';
    case PAYMENT_METHOD.Boleto:
      return 'Boleto';
    case PAYMENT_METHOD.Pix:
      return 'PIX';
    case PAYMENT_METHOD.PixCaixa:
      return 'PIX Caixa';
    case PAYMENT_METHOD.CartaoDebito:
      return 'Cartão de débito';
    case PAYMENT_METHOD.TransferenciaBancaria:
      return 'Transferência bancária';
    default:
      return 'Dinheiro';
  }
}
