// Elements
const form = document.getElementById("transaction-form");
const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("form-date");
const typeInput = document.getElementById("type");
const list = document.getElementById("transaction-list");

const filterMonthInput = document.getElementById("filter-month");
const filterBtn = document.getElementById("filter-btn");
const resetBtn = document.getElementById("reset-btn");

const addBtn = document.getElementById("add-btn");
const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("close-modal");

const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const balanceEl = document.getElementById("balance");
const emptyEl = document.getElementById("list-empty");
const yearSpan = document.getElementById("year");
const themeToggle = document.getElementById("theme-toggle");

// Data
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let filteredTransactions = [...transactions];

// Chart
let chart;

// Utils
function saveToLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

// Render
function updateSummary() {
  const income = filteredTransactions
    .filter(t => t.type === "receita")
    .reduce((s, t) => s + t.amount, 0);

  const expense = filteredTransactions
    .filter(t => t.type === "despesa")
    .reduce((s, t) => s + t.amount, 0);

  const balance = income - expense;

  incomeEl.textContent = formatCurrency(income);
  expenseEl.textContent = formatCurrency(expense);
  balanceEl.textContent = formatCurrency(balance);

  balanceEl.style.color = balance < 0
    ? getComputedStyle(document.documentElement).getPropertyValue('--danger')
    : getComputedStyle(document.documentElement).getPropertyValue('--accent');

  updateChart(income, expense);
}

function renderList() {
  list.innerHTML = "";
  if (filteredTransactions.length === 0) {
    emptyEl.style.display = "block";
  } else {
    emptyEl.style.display = "none";
  }

  filteredTransactions.forEach((t) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.className = "transaction-left";

    const desc = document.createElement("div");
    desc.className = "tx-desc";
    desc.textContent = t.desc;

    const meta = document.createElement("div");
    meta.className = "tx-meta";
    meta.innerHTML = `${formatDateBR(t.date)} • ${t.type === 'receita' ? 'Receita' : 'Despesa'}`;

    left.appendChild(desc);
    left.appendChild(meta);

    const amount = document.createElement("div");
    amount.className = "tx-amount " + (t.type === "receita" ? "receita" : "despesa");
    amount.textContent = formatCurrency(t.amount);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const removeBtn = document.createElement("button");
    removeBtn.className = "icon-btn";
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.title = "Remover";
    removeBtn.addEventListener("click", () => removeTransaction(t.id));

    actions.appendChild(removeBtn);

    li.appendChild(left);
    li.appendChild(amount);
    li.appendChild(actions);

    list.appendChild(li);
  });
}

// Add / Remove
function addTransaction(transaction) {
  transactions.push(transaction);
  saveToLocalStorage();
  applyFilterCurrent();
}

function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToLocalStorage();
  applyFilterCurrent();
}

// Form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const transaction = {
    id: Date.now(),
    desc: descInput.value.trim(),
    amount: parseFloat(amountInput.value),
    date: dateInput.value,
    type: typeInput.value
  };

  if (!transaction.desc || isNaN(transaction.amount) || !transaction.date) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  addTransaction(transaction);
  form.reset();
  closeModal();
});

// Filter
filterBtn.addEventListener("click", () => {
  const val = filterMonthInput.value;
  if (!val) {
    alert("Selecione mês/ano para filtrar.");
    return;
  }
  filteredTransactions = transactions.filter(t => t.date.startsWith(val));
  renderList();
  updateSummary();
});

resetBtn.addEventListener("click", () => {
  filterMonthInput.value = "";
  filteredTransactions = [...transactions];
  renderList();
  updateSummary();
});

function applyFilterCurrent() {
  const current = filterMonthInput.value;
  if (current) {
    filteredTransactions = transactions.filter(t => t.date.startsWith(current));
  } else {
    filteredTransactions = [...transactions];
  }
  renderList();
  updateSummary();
}

// Modal
addBtn.addEventListener("click", () => {
  modal.setAttribute("aria-hidden", "false");
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
  setTimeout(() => descInput.focus(), 120);
});

closeModalBtn.addEventListener("click", closeModal);

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
}

// Chart (doughnut)
function updateChart(income, expense) {
  const ctx = document.getElementById("finance-chart").getContext("2d");
  if (chart) chart.destroy();

  const total = income + expense;
  const data = total > 0 ? [income, expense] : [1, 1]; // evita bug quando tudo é 0

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{
        data,
        backgroundColor: [
          getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00e676',
          getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#ff5252'
        ],
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0f1113',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#fff',
            font: { size: 14 }
          }
        }
      }
    }
  });
}


// Theme
function applySavedTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
  const nowLight = document.documentElement.classList.contains("light");
  localStorage.setItem("theme", nowLight ? "light" : "dark");
});

// Init
function init() {
  yearSpan.textContent = new Date().getFullYear();
  applySavedTheme();
  applyFilterCurrent();
  renderList();
  updateSummary();
}

init();
