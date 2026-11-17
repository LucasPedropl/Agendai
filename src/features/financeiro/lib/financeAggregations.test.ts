import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UNKNOWN_SERVICE_NAME, buildFinanceSummary, buildPerformedServices, filterFinanceTransactions, financeDate } from './financeAggregations';

const now = new Date(2026, 0, 15, 14, 30);

test('performed services combine history and past appointments, deduplicate IDs and resolve catalog prices', () => {
  const performed = buildPerformedServices([
    { Id: 1, ServicoId: 10, DataAgendamento: '2026-01-14', UsuarioNome: 'Ana', ProfissionalNome: 'João' },
    { id: 2, servicoNome: 'Barba', valor: 25, dataAgendamento: '2026-01-13' },
    { id: 3, status: 'Não compareceu' },
    { id: 4, status: 'Cancelado' },
  ], [
    { id: '1', dataAgendamento: '2026-01-15', horaAgendamento: '10:00' },
    { id: 5, servicoNome: 'Barba', dataAgendamento: '2026-01-15', horaAgendamento: '14:30' },
    { id: 6, dataAgendamento: '2026-01-15', horaAgendamento: '15:00' },
    { id: 7, dataAgendamento: '2026-01-14', horaAgendamento: '10:00' },
    { id: 8, status: 'NaoCompareceu', dataAgendamento: '2026-01-15', horaAgendamento: '10:00' },
  ], [{ Id: 10, Nome: 'Corte', Preco: 50 }, { id: 11, nome: 'Barba', preco: 30 }], now);

  assert.deepEqual(performed.map(item => item.appointmentId), ['1', '2', '5']);
  assert.deepEqual(performed.map(item => item.value), [50, 25, 30]);
  assert.equal(performed[0].serviceName, 'Corte');
  assert.equal(performed[0].clientName, 'Ana');
  assert.equal(performed[0].professionalName, 'João');
});

test('a linked payment replaces the performed row while preserving names and all filters', () => {
  const performed = buildPerformedServices([
    { id: 1, servicoNome: 'Corte', valor: 50, usuarioNome: 'Ana', profissionalNome: 'João', dataAgendamento: '2026-01-14' },
  ], [], [], now);
  for (const [code, expectedStatus] of [[0, 'pendente'], [1, 'pago'], [2, 'cancelado'], [3, 'reembolsado']] as const) {
    const summary = buildFinanceSummary(performed, [{ Id: 20, AgendamentoId: '1', Valor: 40, StatusPagamento: code }], now);
    assert.equal(summary.transactions.length, 1);
    assert.equal(summary.transactions[0].paymentId, '20');
    assert.equal(summary.transactions[0].serviceName, 'Corte');
    assert.equal(summary.transactions[0].status, expectedStatus);
    assert.equal(filterFinanceTransactions(summary.transactions, 'joao', 'performed').length, 1);
    assert.equal(filterFinanceTransactions(summary.transactions, 'ana', expectedStatus).length, 1);
    assert.equal(filterFinanceTransactions(summary.transactions, 'inexistente', 'all').length, 0);
    assert.equal(summary.monthlyRevenue.at(-1)?.value, 50);
  }
});

test('monthly revenue uses performed value and only paid unlinked payments, across the year boundary', () => {
  const performed = buildPerformedServices([
    { id: 1, servicoNome: 'Corte', valor: 50, dataAgendamento: '2025-12-31' },
    { id: 2, servicoNome: 'Barba', valor: 30, dataAgendamento: '2026-01-01' },
    { id: 3, servicoNome: 'Corte', valor: 20, dataAgendamento: '2025-07-31' },
  ], [], [], now);
  const summary = buildFinanceSummary(performed, [
    { id: 10, agendamentoId: 1, valor: 45, statusPagamento: 1, dataPagamento: '2026-01-02', metodoPagamento: 3 },
    { id: 11, agendamentoId: 90, valor: 15, statusPagamento: 1, DataPagamento: '2026-01-03', dataCriacao: '2025-12-01' },
    { id: 12, valor: 100, statusPagamento: 0, dataCriacao: '2026-01-04' },
  ], now);

  assert.deepEqual(summary.monthlyRevenue.map(month => month.key), ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01']);
  assert.deepEqual(summary.monthlyRevenue.map(month => month.value), [0, 0, 0, 0, 50, 45]);
  assert.equal(summary.totalReceived, 60);
  assert.equal(summary.paidCount, 2);
  assert.equal(summary.performedTotal, 100);
  assert.equal(summary.averageTicket, 100 / 3);
  assert.equal(summary.transactions.length, 5);
  assert.deepEqual(summary.paymentMethods, [{ name: 'PIX', value: 45 }, { name: 'Não informado', value: 15 }]);
});

test('rankings show the top five with revenue and count, and omit professionals without names', () => {
  const history = Array.from({ length: 7 }, (_, index) => ({
    id: index, servicoId: index, servicoNome: `Serviço ${index}`, valor: index * 10,
    profissionalNome: index > 0 ? 'João' : undefined,
  }));
  const summary = buildFinanceSummary(buildPerformedServices(history, [], [], now), [], now);
  assert.equal(summary.serviceRanking.length, 5);
  assert.deepEqual(summary.serviceRanking.map(item => item.value), [60, 50, 40, 30, 20]);
  assert.equal(summary.professionalRanking[0].value, 210);
  assert.equal(summary.professionalRanking[0].count, 6);
  assert.equal(summary.serviceRanking[0].count, 1);
  assert.deepEqual(summary.paymentMethods, []);
});

test('unlinked paid payments count in monthly revenue but are excluded from top services ranking', () => {
  const performed = buildPerformedServices([
    { id: 1, servicoNome: 'Corte', valor: 50, dataAgendamento: '2026-01-10' },
  ], [], [], now);
  const summary = buildFinanceSummary(performed, [
    { id: 11, valor: 120, statusPagamento: 1, dataPagamento: '2026-01-12' },
  ], now);

  assert.equal(summary.monthlyRevenue.at(-1)?.value, 170);
  assert.deepEqual(summary.serviceRanking.map(item => item.name), ['Corte']);
  assert.ok(!summary.serviceRanking.some(item => item.name === UNKNOWN_SERVICE_NAME));
});

test('empty or incomplete data never creates a date or nonfinite revenue', () => {
  const empty = buildFinanceSummary([], [], now);
  assert.equal(empty.averageTicket, 0);
  assert.deepEqual(empty.transactions, []);
  assert.deepEqual(empty.professionalRanking, []);
  assert.ok(empty.monthlyRevenue.every(month => month.value === 0));
  const incomplete = buildFinanceSummary([], [{ valor: Number.NaN, statusPagamento: 1 }], now);
  assert.equal(incomplete.totalReceived, 0);
  assert.equal(incomplete.transactions[0].date, undefined);
  assert.ok(incomplete.monthlyRevenue.every(month => month.value === 0));
  assert.equal(financeDate('invalid'), undefined);
  assert.equal(financeDate('2026-01-01')?.getDate(), 1);
});
