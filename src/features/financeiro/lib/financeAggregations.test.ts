import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UNKNOWN_SERVICE_NAME, buildClientSpendingSummary, buildFinanceSummary, buildPerformedServices, filterClientSpendingHistory, filterFinanceTransactions, financeDate } from './financeAggregations';

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

test('pending appointments are excluded from both history and today, including establishment revenue', () => {
  const performed = buildPerformedServices([
    { id: 1, status: 'Pendente', valor: 100, dataAgendamento: '2026-01-14' },
    { Id: 2, Status: 'PENDENTE', Valor: 200, DataAgendamento: '2026-01-13' },
    { id: 3, status: 'Confirmado', valor: 30, dataAgendamento: '2026-01-14' },
    { id: 4, status: 'Finalizado', valor: 40, dataAgendamento: '2026-01-13' },
  ], [
    { id: 5, status: 'Pendente', valor: 500, dataAgendamento: '2026-01-15', horaAgendamento: '09:00' },
    { id: 6, status: 'Confirmado', valor: 60, dataAgendamento: '2026-01-15', horaAgendamento: '10:00' },
    { id: 7, status: 'Confirmado', valor: 70, dataAgendamento: '2026-01-15', horaAgendamento: '15:00' },
    { id: 8, status: 'Cancelado', valor: 80, dataAgendamento: '2026-01-15', horaAgendamento: '09:00' },
    { id: 9, status: 'Confirmado', valor: 90, dataAgendamento: '2026-01-16', horaAgendamento: '09:00' },
    { id: 10, status: 'Confirmado', dataAgendamento: '2026-01-15' },
    { id: 11, status: 'Confirmado', dataAgendamento: '2026-01-15', horaAgendamento: '25:00' },
    { id: 12, status: 'Confirmado', dataAgendamento: '2026-01-15', horaAgendamento: '14:60' },
  ], [], now);

  assert.deepEqual(performed.map(item => item.appointmentId), ['3', '4', '6']);
  assert.equal(buildFinanceSummary(performed, [], now).performedTotal, 130);
  assert.equal(buildClientSpendingSummary(performed, now).totalSpent, 130);
});

test('performed services preserve establishment fields and appointment time from both API casings', () => {
  const performed = buildPerformedServices([
    { id: 1, comercioId: 10, comercioNome: 'Salão Azul', horaAgendamento: '9:05:00' },
    { Id: 2, ComercioId: '20', ComercioNome: 'Studio Verde', HoraAgendamento: '16:30:00' },
    { id: 3, estabelecimento: 'Barbearia Central' },
    { Id: 4, Estabelecimento: 'Espaço Bela' },
    { id: 5, comercioNome: ' ', estabelecimento: 'Nome alternativo' },
    { id: 6 },
  ], [], [], now);

  assert.deepEqual(performed.map(item => item.establishmentId), ['10', '20', undefined, undefined, undefined, undefined]);
  assert.deepEqual(performed.map(item => item.establishmentName), ['Salão Azul', 'Studio Verde', 'Barbearia Central', 'Espaço Bela', 'Nome alternativo', undefined]);
  assert.deepEqual(performed.map(item => item.time), ['09:05', '16:30', undefined, undefined, undefined, undefined]);
});

test('client spending totals, average and current calendar month use performed services only', () => {
  const performed = buildPerformedServices([
    { id: 1, servicoNome: 'Corte', valor: 40, dataAgendamento: '2025-07-31' },
    { id: 2, servicoNome: 'Corte', valor: 50, dataAgendamento: '2025-12-31' },
    { id: 3, servicoNome: 'Barba', valor: 30, dataAgendamento: '2026-01-01' },
    { id: 5, status: 'Cancelado', valor: 500, dataAgendamento: '2026-01-02' },
    { id: 6, status: 'NaoCompareceu', valor: 600, dataAgendamento: '2026-01-03' },
  ], [
    { id: 4, status: 'Confirmado', servicoNome: 'Barba', valor: 20, dataAgendamento: '2026-01-15', horaAgendamento: '10:00' },
  ], [], now);
  const summary = buildClientSpendingSummary(performed, now);

  assert.equal(summary.totalSpent, 140);
  assert.equal(summary.servicesCount, 4);
  assert.equal(summary.averagePerService, 35);
  assert.equal(summary.currentMonthSpent, 50);
  assert.equal(summary.currentMonthCount, 2);
  assert.deepEqual(summary.monthlySpending.map(month => month.key), ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01']);
  assert.deepEqual(summary.monthlySpending.map(month => month.value), [0, 0, 0, 0, 50, 50]);
});

test('client calendar month and six-month window respect month and year boundaries', () => {
  const boundary = new Date(2026, 2, 1, 0, 10);
  const performed = buildPerformedServices([
    { id: 1, valor: 5, dataAgendamento: '2025-03-01' },
    { id: 2, valor: 9, dataAgendamento: '2025-09-30' },
    { id: 3, valor: 11, dataAgendamento: '2025-10-01' },
    { id: 4, valor: 15, dataAgendamento: '2026-02-28T23:59:00' },
    { id: 5, valor: 30, dataAgendamento: '2026-03-01' },
  ], [], [], boundary);
  const summary = buildClientSpendingSummary(performed, boundary);

  assert.equal(summary.totalSpent, 70);
  assert.equal(summary.currentMonthSpent, 30);
  assert.equal(summary.currentMonthCount, 1);
  assert.deepEqual(summary.monthlySpending.map(month => month.key), ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03']);
  assert.deepEqual(summary.monthlySpending.map(month => month.value), [11, 0, 0, 0, 15, 30]);
  assert.equal(financeDate(summary.history[0].date)?.getDate(), 1);
});

test('client service ranking groups normalized names across establishment and service IDs', () => {
  const performed = buildPerformedServices([
    { id: 1, servicoId: 10, servicoNome: 'Depilação', comercioId: 1, valor: 40 },
    { id: 2, servicoId: 20, servicoNome: ' DEPILACAO ', comercioId: 2, valor: 30 },
    { id: 3, servicoId: 10, servicoNome: 'Corte', comercioId: 3, valor: 20 },
    { id: 4, valor: 1000 },
  ], [], [], now);
  const summary = buildClientSpendingSummary(performed, now);

  assert.deepEqual(summary.serviceRanking.map(item => ({ name: item.name, value: item.value, count: item.count })), [
    { name: 'Depilação', value: 70, count: 2 },
    { name: 'Corte', value: 20, count: 1 },
  ]);
  assert.ok(!summary.serviceRanking.some(item => item.name === UNKNOWN_SERVICE_NAME));
  assert.equal(summary.totalSpent, 1090);
  // Establishment ranking keeps the existing service-ID grouping.
  assert.equal(buildFinanceSummary(performed, [], now).serviceRanking.find(item => item.key === 'id-10')?.value, 60);
});

test('client establishment ranking ignores unnamed entries and groups by ID or normalized fallback name', () => {
  const performed = buildPerformedServices([
    { id: 1, comercioId: 1, valor: 1000 },
    { id: 2, comercioId: 2, comercioNome: ' ', valor: 500 },
    { id: 3, comercioId: 3, comercioNome: 'Studio Verde', valor: 30 },
    { id: 4, comercioId: 3, comercioNome: 'Studio Verde', valor: 40 },
    { id: 5, estabelecimento: 'Salão Azul', valor: 20 },
    { id: 6, Estabelecimento: 'SALAO AZUL', valor: 10 },
    { id: 7, comercioId: 4, comercioNome: 'Studio Verde', valor: 5 },
  ], [], [], now);
  const summary = buildClientSpendingSummary(performed, now);

  assert.deepEqual(summary.establishmentRanking, [
    { key: 'id-3', name: 'Studio Verde', value: 70, count: 2 },
    { key: 'name-salaoazul', name: 'Salão Azul', value: 30, count: 2 },
    { key: 'id-4', name: 'Studio Verde', value: 5, count: 1 },
  ]);
  assert.deepEqual(buildClientSpendingSummary(performed.slice(0, 2), now).establishmentRanking, []);
});

test('both client rankings are limited to the top five and include all-time spending', () => {
  const performed = buildPerformedServices(Array.from({ length: 7 }, (_, index) => ({
    id: index, servicoNome: `Serviço ${index}`, comercioId: index, comercioNome: `Salão ${index}`,
    valor: index * 10, dataAgendamento: '2024-01-01',
  })), [], [], now);
  const summary = buildClientSpendingSummary(performed, now);

  assert.deepEqual(summary.serviceRanking.map(item => item.value), [60, 50, 40, 30, 20]);
  assert.deepEqual(summary.establishmentRanking.map(item => item.value), [60, 50, 40, 30, 20]);
  assert.ok(summary.monthlySpending.every(month => month.value === 0));
});

test('client history sorts newest date then time first without mutating performed services', () => {
  const performed = buildPerformedServices([
    { id: 1, dataAgendamento: '2026-01-14', horaAgendamento: '9:00' },
    { id: 2, dataAgendamento: '2026-01-13', horaAgendamento: '23:00' },
    { id: 3, dataAgendamento: '2026-01-14T00:00:00', horaAgendamento: '16:30:00' },
    { id: 4, dataAgendamento: '2026-01-14' },
    { id: 5 },
    { id: 6, dataAgendamento: 'invalid' },
  ], [
    { id: 7, dataAgendamento: '2026-01-15', horaAgendamento: '10:00' },
  ], [], now);
  const originalOrder = performed.map(item => item.appointmentId);
  const summary = buildClientSpendingSummary(performed, now);

  assert.deepEqual(summary.history.map(item => item.appointmentId), ['7', '3', '1', '4', '2', '5', '6']);
  assert.deepEqual(performed.map(item => item.appointmentId), originalOrder);
});

test('client history search matches service, establishment and professional ignoring case and accents', () => {
  const performed = buildPerformedServices([
    { id: 1, servicoNome: 'Depilação', estabelecimento: 'Salão Azul', profissionalNome: 'João' },
    { id: 2, servicoNome: 'Barba', estabelecimento: 'Studio Verde', profissionalNome: 'José' },
  ], [], [], now);

  for (const search of ['DEPILACAO', 'salao azul', 'JOAO']) {
    assert.deepEqual(filterClientSpendingHistory(performed, search).map(item => item.appointmentId), ['1']);
  }
  assert.deepEqual(filterClientSpendingHistory(performed, '   '), performed);
  assert.deepEqual(filterClientSpendingHistory(performed, 'inexistente'), []);
});

test('empty client spending returns zero totals, no history or rankings and six zero months', () => {
  const summary = buildClientSpendingSummary([], now);

  assert.equal(summary.totalSpent, 0);
  assert.equal(summary.servicesCount, 0);
  assert.equal(summary.averagePerService, 0);
  assert.equal(summary.currentMonthSpent, 0);
  assert.equal(summary.currentMonthCount, 0);
  assert.deepEqual(summary.history, []);
  assert.deepEqual(summary.serviceRanking, []);
  assert.deepEqual(summary.establishmentRanking, []);
  assert.equal(summary.monthlySpending.length, 6);
  assert.ok(summary.monthlySpending.every(month => month.value === 0));
});
