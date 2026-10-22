import { describe, expect, it } from "vitest";
import { evaluateSheet, functionsBehind, serial, type Raw } from ".";

/** Evaluate one formula over optional cells and return its value. */
function calc(formula: string, cells: Raw = {}) {
  const s = evaluateSheet({ ...cells, Z99: formula }, 100, 26);
  return s.values.Z99;
}
const near = (v: unknown, x: number, dp = 6) => { expect(typeof v).toBe("number"); expect(v as number).toBeCloseTo(x, dp); };

describe("arithmetic and references", () => {
  it("follows Excel precedence", () => {
    expect(calc("=1+2*3")).toBe(7);
    expect(calc("=-2^2")).toBe(4); // negation binds before ^ in Excel
    expect(calc("=2^3^2")).toBe(64); // left-associative
    expect(calc("=10%*50")).toBe(5);
    expect(calc('="a"&1&TRUE')).toBe("a1TRUE");
    expect(calc("=1/0")).toEqual({ error: "#DIV/0!" });
  });
  it("reads numbers the way people type them", () => {
    const s = evaluateSheet({ A1: "1,250", A2: "8%", A3: "(40)", A4: "Revenue", A5: "=SUM(A1:A4)" }, 10, 5);
    expect(s.values.A2).toBeCloseTo(0.08);
    expect(s.values.A5).toBeCloseTo(1210.08);
  });
  it("supports absolute references and ranges", () => {
    expect(calc("=$A$1*B$1", { A1: "3", B1: "4" })).toBe(12);
    expect(calc("=SUM(B1:A2)", { A1: "1", A2: "2", B1: "3", B2: "4" })).toBe(10);
  });
  it("detects circular references", () => {
    const s = evaluateSheet({ A1: "=B1", B1: "=A1+1" }, 5, 5);
    expect(s.values.A1).toEqual({ error: "#CIRC!" });
  });
  it("flags unknown functions and bad formulas", () => {
    expect(calc("=NOPE(1)")).toEqual({ error: "#NAME?" });
    const s = evaluateSheet({ A1: "=SUM(1,", B1: "=1+" }, 5, 5);
    expect(s.values.A1).toEqual({ error: "#NAME?" });
    expect(s.problems.A1).toBeTruthy();
  });
  it("returns #REF! outside the sheet", () => {
    expect(evaluateSheet({ A1: "=SUM(A1:Z500)" }, 5, 5).values.A1).toEqual({ error: "#REF!" });
  });
});

// Expected values are the worked examples in Microsoft's Excel function documentation.
describe("time value of money", () => {
  it("PMT, PV, FV, NPER, RATE", () => {
    near(calc("=PMT(8%/12,10,10000)"), -1037.032089, 5);
    near(calc("=PMT(6%/12,18*12,0,50000)"), -129.0811609, 5);
    near(calc("=PV(0.08/12,12*20,500,,0)"), -59777.14585, 4);
    near(calc("=FV(0.06/12,10,-200,-500,1)"), 2581.403374, 5);
    near(calc("=NPER(0.12/12,-100,-1000,10000,1)"), 59.6738657, 6);
    near(calc("=RATE(4*12,-200,8000)"), 0.007701472, 8);
  });
  it("IPMT, PPMT, CUMIPMT, CUMPRINC", () => {
    near(calc("=IPMT(0.1/12,1,3*12,8000)"), -66.66666667, 6);
    near(calc("=IPMT(0.1,3,3,8000)"), -292.4471299, 6);
    near(calc("=PPMT(0.1/12,1,2*12,2000)"), -75.62318601, 6);
    near(calc("=CUMIPMT(0.09/12,30*12,125000,13,24,0)"), -11135.23213, 4);
    near(calc("=CUMPRINC(0.09/12,30*12,125000,13,24,0)"), -934.1071234, 4);
  });
});

describe("discounting and returns", () => {
  it("NPV and IRR", () => {
    near(calc("=NPV(0.1,-10000,3000,4200,6800)"), 1188.443412, 5);
    const flows = { A1: "-70000", A2: "12000", A3: "15000", A4: "18000", A5: "21000", A6: "26000" };
    near(calc("=IRR(A1:A5)", flows), -0.021244848, 7);
    near(calc("=IRR(A1:A6)", flows), 0.086630948, 7);
    near(calc("=IRR(A1:A3,-10%)", flows), -0.443506941, 6);
  });
  it("XNPV and XIRR", () => {
    const cells = {
      A1: "-10000", A2: "2750", A3: "4250", A4: "3250", A5: "2750",
      B1: String(serial(2008, 1, 1)), B2: String(serial(2008, 3, 1)), B3: String(serial(2008, 10, 30)), B4: String(serial(2009, 2, 15)), B5: String(serial(2009, 4, 1)),
    };
    near(calc("=XNPV(0.09,A1:A5,B1:B5)", cells), 2086.647602, 4);
    near(calc("=XIRR(A1:A5,B1:B5)", cells), 0.373362535, 7);
  });
  it("MIRR", () => {
    const flows = { A1: "-120000", A2: "39000", A3: "30000", A4: "21000", A5: "37000", A6: "46000" };
    near(calc("=MIRR(A1:A6,10%,12%)", flows), 0.1261, 4); // documented as 12.61%
  });
  it("IRR with no sign change is #NUM!", () => {
    expect(calc("=IRR(A1:A2)", { A1: "1", A2: "2" })).toEqual({ error: "#NUM!" });
  });
});

describe("lookups", () => {
  const table = { A1: "Peer A", A2: "Peer B", A3: "Peer C", B1: "8.5", B2: "10.2", B3: "12", C1: "1", C2: "2", C3: "3" };
  it("INDEX/MATCH, XLOOKUP, VLOOKUP, HLOOKUP, CHOOSE", () => {
    expect(calc('=INDEX(B1:B3,MATCH("peer b",A1:A3,0))', table)).toBe(10.2);
    expect(calc("=INDEX(A1:C3,3,2)", table)).toBe(12);
    expect(calc('=XLOOKUP("Peer C",A1:A3,B1:B3)', table)).toBe(12);
    expect(calc('=XLOOKUP("Peer Z",A1:A3,B1:B3,"none")', table)).toBe("none");
    expect(calc('=VLOOKUP("Peer A",A1:C3,2,FALSE)', table)).toBe(8.5);
    expect(calc("=MATCH(2.5,C1:C3,1)", table)).toBe(2);
    expect(calc("=XLOOKUP(2.5,C1:C3,B1:B3,,1)", table)).toBe(12);
    expect(calc("=HLOOKUP(2,A1:C2,2)", { A1: "1", B1: "2", C1: "3", A2: "x", B2: "y", C2: "z" })).toBe("y");
    expect(calc("=CHOOSE(2,1/0,7,8)")).toBe(7);
    expect(calc('=MATCH("P*C",A1:A3,0)', table)).toBe(3);
  });
});

describe("logic, aggregation, rounding, dates", () => {
  it("IF branches lazily, IFERROR catches", () => {
    expect(calc("=IF(1>0,5,1/0)")).toBe(5);
    expect(calc("=IFERROR(1/0,0)")).toBe(0);
    expect(calc("=IFS(FALSE,1,TRUE,2)")).toBe(2);
    expect(calc("=AND(TRUE,1,OR(FALSE,0))")).toBe(false);
  });
  it("SUMIF(S), COUNTIF(S), AVERAGEIF, SUMPRODUCT", () => {
    const c = { A1: "East", A2: "West", A3: "East", B1: "100", B2: "200", B3: "300", C1: "2024", C2: "2024", C3: "2025" };
    expect(calc('=SUMIF(A1:A3,"East",B1:B3)', c)).toBe(400);
    expect(calc('=SUMIF(B1:B3,">150")', c)).toBe(500);
    expect(calc('=SUMIFS(B1:B3,A1:A3,"East",C1:C3,2025)', c)).toBe(300);
    expect(calc('=COUNTIFS(A1:A3,"E*",B1:B3,"<>100")', c)).toBe(1);
    expect(calc('=AVERAGEIF(A1:A3,"East",B1:B3)', c)).toBe(200);
    expect(calc("=SUMPRODUCT(B1:B3,C1:C3)", c)).toBe(100 * 2024 + 200 * 2024 + 300 * 2025);
    expect(calc("=MEDIAN(B1:B3,1000)", c)).toBe(250);
  });
  it("rounds half away from zero", () => {
    expect(calc("=ROUND(2.5,0)")).toBe(3);
    expect(calc("=ROUND(-2.5,0)")).toBe(-3);
    expect(calc("=ROUND(1.005,2)")).toBe(1.01);
    expect(calc("=ROUNDDOWN(3.14159,3)")).toBe(3.141);
    expect(calc("=ROUNDUP(-3.14159,1)")).toBe(-3.2);
    expect(calc("=ROUND(1234.5678,-2)")).toBe(1200);
    expect(calc("=MOD(-3,2)")).toBe(1);
  });
  it("date serials and date functions", () => {
    expect(calc("=DATE(2008,1,1)")).toBe(39448);
    expect(calc("=EOMONTH(DATE(2011,1,1),1)")).toBe(serial(2011, 2, 28));
    expect(calc("=EOMONTH(DATE(2011,1,1),-3)")).toBe(serial(2010, 10, 31));
    expect(calc("=EDATE(DATE(2011,1,31),1)")).toBe(serial(2011, 2, 28));
    expect(calc("=YEAR(DATE(2024,2,29))")).toBe(2024);
    expect(calc("=DAYS(DATE(2021,3,15),DATE(2021,2,1))")).toBe(42);
    near(calc("=YEARFRAC(DATE(2012,1,1),DATE(2012,7,30))"), 0.580555556, 8);
    near(calc("=YEARFRAC(DATE(2012,1,1),DATE(2012,7,30),1)"), 0.576502732, 8);
    near(calc("=YEARFRAC(DATE(2012,1,1),DATE(2012,7,30),3)"), 211 / 365, 10);
  });
});

describe("dependency tracing", () => {
  it("finds functions used by a cell and its precedents", () => {
    const s = evaluateSheet({ A1: "=XIRR(B1:B2,C1:C2)", A2: "=A1*1", A3: "=ROUND(A2,4)" }, 5, 5);
    expect([...functionsBehind(s, "A3")].sort()).toEqual(["ROUND", "XIRR"]);
  });
});

describe("copy and fill", () => {
  it("shifts relative references and keeps absolute ones", async () => {
    const { shiftFormula } = await import(".");
    expect(shiftFormula("=C10*$B$4", 0, 1)).toBe("=D10*$B$4");
    expect(shiftFormula("=B16*(1+$B4)+C$2", 1, 1)).toBe("=C17*(1+$B5)+D$2");
    expect(shiftFormula('=SUM(C11:G11)&"A1"', 1, 0)).toBe('=SUM(C12:G12)&"A1"');
    expect(shiftFormula("=LOG10(A1)", 0, 1)).toBe("=LOG10(B1)");
    expect(shiftFormula("=A1", 0, -1)).toBe("=#REF!");
    expect(shiftFormula("42", 3, 3)).toBe("42");
  });
});
