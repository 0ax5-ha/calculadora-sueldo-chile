const afpRates = [
  { id: "capital", name: "Capital", commission: 1.44 },
  { id: "cuprum", name: "Cuprum", commission: 1.44 },
  { id: "habitat", name: "Habitat", commission: 1.27 },
  { id: "modelo", name: "Modelo", commission: 0.58 },
  { id: "planvital", name: "PlanVital", commission: 1.16 },
  { id: "provida", name: "ProVida", commission: 1.45 },
  { id: "uno", name: "UNO", commission: 0.46 },
];

const taxBrackets = [
  { from: 0, to: 13.5, rate: 0, deduction: 0 },
  { from: 13.5, to: 30, rate: 0.04, deduction: 0.54 },
  { from: 30, to: 50, rate: 0.08, deduction: 1.74 },
  { from: 50, to: 70, rate: 0.135, deduction: 4.49 },
  { from: 70, to: 90, rate: 0.23, deduction: 11.14 },
  { from: 90, to: 120, rate: 0.304, deduction: 17.8 },
  { from: 120, to: 150, rate: 0.35, deduction: 23.32 },
  { from: 150, to: Infinity, rate: 0.4, deduction: 30.82 },
];

const formatMoney = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const fields = {
  grossSalary: document.querySelector("#grossSalary"),
  afp: document.querySelector("#afp"),
  contractType: document.querySelector("#contractType"),
  healthType: document.querySelector("#healthType"),
  isapreUf: document.querySelector("#isapreUf"),
  ufValue: document.querySelector("#ufValue"),
  afpCapUf: document.querySelector("#afpCapUf"),
  unemploymentCapUf: document.querySelector("#unemploymentCapUf"),
  utmValue: document.querySelector("#utmValue"),
  apv: document.querySelector("#apv"),
  otherDiscounts: document.querySelector("#otherDiscounts"),
  sisRate: document.querySelector("#sisRate"),
  homePrice: document.querySelector("#homePrice"),
  downPaymentPercent: document.querySelector("#downPaymentPercent"),
  mortgageYears: document.querySelector("#mortgageYears"),
  annualRate: document.querySelector("#annualRate"),
  rateType: document.querySelector("#rateType"),
  closingCosts: document.querySelector("#closingCosts"),
  lifeInsurance: document.querySelector("#lifeInsurance"),
  monthlyMortgageFees: document.querySelector("#monthlyMortgageFees"),
  loanAmount: document.querySelector("#loanAmount"),
  loanMonths: document.querySelector("#loanMonths"),
  loanRateMode: document.querySelector("#loanRateMode"),
  loanRate: document.querySelector("#loanRate"),
  loanInsurance: document.querySelector("#loanInsurance"),
  loanInitialFees: document.querySelector("#loanInitialFees"),
  loanPrepayment: document.querySelector("#loanPrepayment"),
};

const netPay = document.querySelector("#netPay");
const breakdown = document.querySelector("#breakdown");
const employerCost = document.querySelector("#employerCost");
const monthlyPayment = document.querySelector("#monthlyPayment");
const mortgageBreakdown = document.querySelector("#mortgageBreakdown");
const rateNote = document.querySelector("#rateNote");
const loanPayment = document.querySelector("#loanPayment");
const loanBreakdown = document.querySelector("#loanBreakdown");
const loanNote = document.querySelector("#loanNote");
const budgetInputs = document.querySelector("#budgetInputs");
const budgetDonut = document.querySelector("#budgetDonut");
const budgetTotal = document.querySelector("#budgetTotal");
const budgetStatus = document.querySelector("#budgetStatus");

const budgetCategories = [
  { id: "housing", name: "Vivienda / arriendo", percent: 30, color: "#3066be" },
  { id: "food", name: "Comida", percent: 18, color: "#1f8a57" },
  { id: "transport", name: "Transporte", percent: 8, color: "#208b9c" },
  { id: "debts", name: "Deudas", percent: 10, color: "#cb4f5d" },
  { id: "savings", name: "Ahorro / inversion", percent: 20, color: "#6b5bd6" },
  { id: "free", name: "Libre / ocio", percent: 14, color: "#c8861f" },
];

let lastLiquidSalary = 0;

function numberFrom(input) {
  const rawValue = input.value.trim();
  const normalized = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : rawValue.replace(/\.(?=\d{3}(\D|$))/g, "");
  return Number(normalized) || 0;
}

function cappedBase(grossSalary, ufValue, capUf) {
  return Math.min(grossSalary, ufValue * capUf);
}

function money(value) {
  return formatMoney.format(Math.round(value));
}

function addRow(container, label, value, className = "") {
  const row = document.createElement("div");
  row.className = `row ${className}`;
  row.innerHTML = `<span>${label}</span><strong>${money(value)}</strong>`;
  container.appendChild(row);
}

function addTextRow(container, label, value, className = "") {
  const row = document.createElement("div");
  row.className = `row ${className}`;
  row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
  container.appendChild(row);
}

function calculateTax(taxableIncome, utmValue) {
  if (taxableIncome <= 0 || utmValue <= 0) {
    return { tax: 0, bracket: taxBrackets[0] };
  }

  const taxableUtm = taxableIncome / utmValue;
  const bracket = taxBrackets.find((item) => taxableUtm > item.from && taxableUtm <= item.to) || taxBrackets.at(-1);
  const tax = Math.max(0, taxableIncome * bracket.rate - bracket.deduction * utmValue);
  return { tax, bracket };
}

function calculate() {
  const grossSalary = numberFrom(fields.grossSalary);
  const ufValue = numberFrom(fields.ufValue);
  const afpCapUf = numberFrom(fields.afpCapUf);
  const unemploymentCapUf = numberFrom(fields.unemploymentCapUf);
  const utmValue = numberFrom(fields.utmValue);
  const selectedAfp = afpRates.find((afp) => afp.id === fields.afp.value) || afpRates[0];

  const pensionBase = cappedBase(grossSalary, ufValue, afpCapUf);
  const unemploymentBase = cappedBase(grossSalary, ufValue, unemploymentCapUf);
  const afpMandatory = pensionBase * 0.1;
  const afpCommission = pensionBase * (selectedAfp.commission / 100);
  const healthLegal = pensionBase * 0.07;
  const isaprePlan = fields.healthType.value === "isapre" ? numberFrom(fields.isapreUf) * ufValue : 0;
  const healthDiscount = Math.max(healthLegal, isaprePlan);
  const unemploymentWorker = fields.contractType.value === "indefinido" ? unemploymentBase * 0.006 : 0;
  const apv = numberFrom(fields.apv);
  const otherDiscounts = numberFrom(fields.otherDiscounts);
  const taxableIncome = Math.max(0, grossSalary - afpMandatory - afpCommission - healthDiscount - unemploymentWorker);
  const incomeTax = fields.contractType.value === "honorarios" ? 0 : calculateTax(taxableIncome, utmValue).tax;
  const totalDiscounts = afpMandatory + afpCommission + healthDiscount + unemploymentWorker + incomeTax + apv + otherDiscounts;
  const liquidSalary = Math.max(0, grossSalary - totalDiscounts);
  lastLiquidSalary = liquidSalary;

  const sisEmployer = pensionBase * (numberFrom(fields.sisRate) / 100);
  const employerUnemploymentRate = fields.contractType.value === "indefinido" ? 0.024 : fields.contractType.value === "plazo" ? 0.03 : 0;
  const employerUnemployment = unemploymentBase * employerUnemploymentRate;
  const mutualEstimate = pensionBase * 0.0093;
  const employerTotal = grossSalary + sisEmployer + employerUnemployment + mutualEstimate;

  netPay.textContent = money(liquidSalary);
  breakdown.replaceChildren();
  employerCost.replaceChildren();

  addRow(breakdown, "Base imponible usada para AFP y salud", pensionBase, "positive");
  addRow(breakdown, "AFP obligatoria 10%", -afpMandatory, "negative");
  addRow(breakdown, `Comision AFP ${selectedAfp.name} ${selectedAfp.commission}%`, -afpCommission, "negative");
  addRow(breakdown, fields.healthType.value === "isapre" ? "Salud Isapre / minimo 7%" : "Salud Fonasa 7%", -healthDiscount, "negative");
  addRow(breakdown, "Seguro de cesantia trabajador", -unemploymentWorker, "negative");
  addRow(breakdown, "Impuesto unico segunda categoria", -incomeTax, "negative");
  addRow(breakdown, "APV", -apv, "negative");
  addRow(breakdown, "Otros descuentos", -otherDiscounts, "negative");
  addRow(breakdown, "Total descuentos", -totalDiscounts, "negative");

  addRow(employerCost, "Sueldo bruto", grossSalary, "positive");
  addRow(employerCost, "SIS empleador", sisEmployer);
  addRow(employerCost, "Seguro de cesantia empleador", employerUnemployment);
  addRow(employerCost, "Mutual estimada 0,93%", mutualEstimate);
  addRow(employerCost, "Costo total estimado", employerTotal, "positive");

  calculateMortgage();
  calculateLoan();
  calculateBudget();
}

function calculateMortgage() {
  const homePrice = numberFrom(fields.homePrice);
  const downPaymentPercent = Math.min(100, Math.max(0, numberFrom(fields.downPaymentPercent)));
  const years = Math.max(1, numberFrom(fields.mortgageYears));
  const annualRate = Math.max(0, numberFrom(fields.annualRate));
  const closingCosts = numberFrom(fields.closingCosts);
  const lifeInsurance = numberFrom(fields.lifeInsurance);
  const monthlyFees = numberFrom(fields.monthlyMortgageFees);
  const months = years * 12;
  const downPayment = homePrice * (downPaymentPercent / 100);
  const principal = Math.max(0, homePrice - downPayment);
  const monthlyRate = annualRate / 100 / 12;
  const baseInstallment = monthlyRate === 0
    ? principal / months
    : principal * (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  const monthlyTotal = baseInstallment + lifeInsurance + monthlyFees;
  const totalInterest = Math.max(0, baseInstallment * months - principal);
  const totalInsuranceAndFees = (lifeInsurance + monthlyFees) * months;
  const totalCost = downPayment + principal + totalInterest + totalInsuranceAndFees + closingCosts;
  const burden = lastLiquidSalary > 0 ? monthlyTotal / lastLiquidSalary * 100 : 0;

  monthlyPayment.textContent = money(monthlyTotal);
  mortgageBreakdown.replaceChildren();

  addRow(mortgageBreakdown, "Valor vivienda", homePrice, "positive");
  addRow(mortgageBreakdown, "Pie inicial", downPayment);
  addRow(mortgageBreakdown, "Monto credito", principal);
  addTextRow(mortgageBreakdown, "Tasa de interes mensual", `${(monthlyRate * 100).toFixed(3)}%`);
  addRow(mortgageBreakdown, "Valor cuota base", baseInstallment);
  addRow(mortgageBreakdown, "Seguro desgravamen mensual", lifeInsurance);
  addRow(mortgageBreakdown, "Gastos asociados mensuales", monthlyFees);
  addRow(mortgageBreakdown, "Gastos operacionales iniciales", closingCosts);
  addRow(mortgageBreakdown, "Total intereses", totalInterest, "negative");
  addRow(mortgageBreakdown, "Costo total estimado", totalCost, "positive");
  addTextRow(mortgageBreakdown, "Carga sobre sueldo liquido", `${burden.toFixed(1)}%`, burden > 30 ? "negative" : "positive");

  const notes = {
    fixed: "Interes fijo: la tasa se mantiene durante todo el plazo, por eso el dividendo es mas predecible.",
    variable: "Interes variable: la cuota puede subir o bajar si cambia la tasa. Este calculo usa la tasa actual como escenario.",
    mixed: "Interes mixto: normalmente parte fijo y luego puede variar. Aqui se estima con la tasa ingresada para comparar escenarios.",
  };
  rateNote.textContent = notes[fields.rateType.value];
}

function calculateLoan() {
  const requestedAmount = numberFrom(fields.loanAmount);
  const months = Math.max(1, numberFrom(fields.loanMonths));
  const rateInput = Math.max(0, numberFrom(fields.loanRate));
  const monthlyRate = fields.loanRateMode.value === "annual" ? rateInput / 100 / 12 : rateInput / 100;
  const insurance = numberFrom(fields.loanInsurance);
  const initialFees = numberFrom(fields.loanInitialFees);
  const prepayment = Math.min(requestedAmount, Math.max(0, numberFrom(fields.loanPrepayment)));
  const financedAmount = Math.max(0, requestedAmount - prepayment);
  const basePayment = monthlyRate === 0
    ? financedAmount / months
    : financedAmount * (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  const monthlyTotal = basePayment + insurance;
  const totalInterest = Math.max(0, basePayment * months - financedAmount);
  const totalInsurance = insurance * months;
  const totalPaid = monthlyTotal * months + initialFees + prepayment;
  const totalCost = financedAmount + totalInterest + totalInsurance + initialFees + prepayment;
  const burden = lastLiquidSalary > 0 ? monthlyTotal / lastLiquidSalary * 100 : 0;

  loanPayment.textContent = money(monthlyTotal);
  loanBreakdown.replaceChildren();

  addRow(loanBreakdown, "Monto solicitado", requestedAmount, "positive");
  addRow(loanBreakdown, "Abono inicial", prepayment);
  addRow(loanBreakdown, "Monto financiado", financedAmount);
  addTextRow(loanBreakdown, "Tasa de interes mensual", `${(monthlyRate * 100).toFixed(3)}%`);
  addRow(loanBreakdown, "Valor cuota base", basePayment);
  addRow(loanBreakdown, "Seguro mensual", insurance);
  addRow(loanBreakdown, "Comision / gastos iniciales", initialFees);
  addRow(loanBreakdown, "Total intereses", totalInterest, "negative");
  addRow(loanBreakdown, "Total seguros", totalInsurance, "negative");
  addRow(loanBreakdown, "Total pagado", totalPaid, "positive");
  addRow(loanBreakdown, "Costo total del credito", totalCost, "positive");
  addTextRow(loanBreakdown, "Carga sobre sueldo liquido", `${burden.toFixed(1)}%`, burden > 20 ? "negative" : "positive");

  loanNote.textContent = burden > 20
    ? "Ojo: esta cuota supera el 20% del sueldo liquido estimado. Puede apretar mucho el presupuesto mensual."
    : "La cuota queda bajo el 20% del sueldo liquido estimado, un rango mas comodo para comparar alternativas.";
}

function createBudgetInputs() {
  budgetCategories.forEach((category) => {
    const wrapper = document.createElement("div");
    wrapper.className = "budget-input-row";
    wrapper.innerHTML = `
      <label>
        ${category.name}
        <input id="budget-${category.id}" type="range" min="0" max="100" step="1" value="${category.percent}" />
      </label>
      <label>
        %
        <input id="budget-text-${category.id}" type="text" inputmode="numeric" value="${category.percent}" />
      </label>
    `;
    budgetInputs.appendChild(wrapper);

    const slider = wrapper.querySelector(`#budget-${category.id}`);
    const text = wrapper.querySelector(`#budget-text-${category.id}`);
    slider.addEventListener("input", () => {
      text.value = slider.value;
      calculateBudget();
    });
    text.addEventListener("input", () => {
      slider.value = Math.min(100, Math.max(0, numberFrom(text)));
      calculateBudget();
    });
  });
}

function calculateBudget() {
  const budgetList = document.querySelector("#budgetList");
  let usedPercent = 0;
  let gradientParts = [];
  let cursor = 0;

  budgetList.replaceChildren();

  budgetCategories.forEach((category) => {
    const percent = Math.min(100, Math.max(0, numberFrom(document.querySelector(`#budget-text-${category.id}`))));
    const amount = lastLiquidSalary * (percent / 100);
    usedPercent += percent;

    const start = cursor;
    const end = cursor + percent * 3.6;
    gradientParts.push(`${category.color} ${start}deg ${end}deg`);
    cursor = end;

    const item = document.createElement("div");
    item.className = "budget-item";
    item.innerHTML = `
      <div class="budget-item-header">
        <span>${category.name} (${percent}%)</span>
        <strong>${money(amount)}</strong>
      </div>
      <div class="budget-bar"><span style="width: ${Math.min(percent, 100)}%; background: ${category.color};"></span></div>
    `;
    budgetList.appendChild(item);
  });

  const assigned = lastLiquidSalary * (usedPercent / 100);
  const remainderPercent = Math.max(0, 100 - usedPercent);
  const remainderAmount = lastLiquidSalary - assigned;
  gradientParts.push(`#d7ded8 ${cursor}deg 360deg`);

  budgetDonut.style.background = `conic-gradient(${gradientParts.join(", ")})`;
  budgetTotal.textContent = money(assigned);
  budgetStatus.textContent = `${usedPercent}% usado · ${money(remainderAmount)} ${remainderPercent >= 0 ? "libre" : "sobrepasado"}`;
  budgetStatus.className = usedPercent > 100 ? "mini-label warning" : "mini-label";
}

function setup() {
  afpRates.forEach((afp) => {
    const option = document.createElement("option");
    option.value = afp.id;
    option.textContent = `${afp.name} (${afp.commission}%)`;
    fields.afp.appendChild(option);
  });
  fields.afp.value = "modelo";
  createBudgetInputs();

  Object.values(fields).forEach((field) => {
    if (field) {
      field.addEventListener("input", calculate);
      field.addEventListener("change", calculate);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  calculate();
}

setup();
