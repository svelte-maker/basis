// Simplified leveraged buyout with mandatory amortisation and a cash sweep.
// Interest is charged on opening debt to avoid a circular reference, as most interview LBOs do.
import { irr } from "./tvm";

export type LboInput = {
  entryEbitda: number; entryMultiple: number; leverageMultiple: number; feesPct: number;
  years: number; ebitdaGrowth: number; daPctEbitda: number; capexPctEbitda: number; nwcPctEbitda: number;
  interestRate: number; mandatoryAmortPct: number; cashSweepPct: number; taxRate: number; exitMultiple: number;
};

export type LboYear = {
  year: number; ebitda: number; da: number; ebit: number; interest: number; tax: number; netIncome: number;
  capex: number; changeNwc: number; fcf: number; mandatory: number; sweep: number; debtEnd: number; cashEnd: number;
};

export type LboResult = {
  entryEV: number; fees: number; entryDebt: number; entryEquity: number; schedule: LboYear[];
  exitEV: number; exitDebt: number; exitCash: number; exitEquity: number; moic: number; irr: number;
  attribution: { ebitdaGrowth: number; multipleExpansion: number; debtPaydownAndCash: number; fees: number };
};

export function runLbo(i: LboInput): LboResult {
  const entryEV = i.entryEbitda * i.entryMultiple;
  const fees = entryEV * i.feesPct;
  const entryDebt = i.entryEbitda * i.leverageMultiple;
  const entryEquity = entryEV + fees - entryDebt;
  if (entryEquity <= 0) throw new RangeError("Debt exceeds purchase price plus fees");
  let debt = entryDebt, cash = 0, ebitda = i.entryEbitda;
  let prevNwc = i.entryEbitda * i.nwcPctEbitda;
  const schedule: LboYear[] = [];
  for (let y = 1; y <= i.years; y++) {
    ebitda *= 1 + i.ebitdaGrowth;
    const da = ebitda * i.daPctEbitda;
    const ebit = ebitda - da;
    const interest = debt * i.interestRate;
    const ebt = ebit - interest;
    const tax = Math.max(0, ebt * i.taxRate);
    const netIncome = ebt - tax;
    const capex = ebitda * i.capexPctEbitda;
    const nwc = ebitda * i.nwcPctEbitda;
    const changeNwc = nwc - prevNwc;
    prevNwc = nwc;
    const fcf = netIncome + da - capex - changeNwc;
    const mandatory = Math.min(debt, entryDebt * i.mandatoryAmortPct);
    const available = fcf + cash - mandatory; // cash on hand can also be swept
    const sweep = Math.max(0, Math.min(debt - mandatory, available * i.cashSweepPct));
    debt -= mandatory + sweep;
    cash = cash + fcf - mandatory - sweep;
    schedule.push({ year: y, ebitda, da, ebit, interest, tax, netIncome, capex, changeNwc, fcf, mandatory, sweep, debtEnd: debt, cashEnd: cash });
  }
  const exitEV = ebitda * i.exitMultiple;
  const exitEquity = exitEV - debt + cash;
  const flows = [-entryEquity, ...Array(i.years - 1).fill(0), exitEquity];
  return {
    entryEV, fees, entryDebt, entryEquity, schedule, exitEV, exitDebt: debt, exitCash: cash, exitEquity,
    moic: exitEquity / entryEquity, irr: irr(flows),
    attribution: {
      ebitdaGrowth: (ebitda - i.entryEbitda) * i.entryMultiple,
      multipleExpansion: (i.exitMultiple - i.entryMultiple) * ebitda,
      debtPaydownAndCash: entryDebt - debt + cash,
      fees: -fees,
    },
  };
}
