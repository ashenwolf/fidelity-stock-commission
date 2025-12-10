class CurrencyMonitor {
  constructor() {
    this.deltaChart = null;
    this.rateChart = null;
    this.settings = this.loadSettings();
    this.initializeElements();
    this.bindEvents();
    this.loadInitialData();
  }

  initializeElements() {
    this.saleDateInput = document.getElementById("saleDate");
    this.usdAmountInput = document.getElementById("usdAmount");
    this.commissionInput = document.getElementById("commission");
    this.updateButton = document.getElementById("updateSettings");
    this.basePriceEl = document.getElementById("basePrice");
    this.saleDayDeltaEl = document.getElementById("saleDayDelta");
    this.saleDayDeltaLabel = document.getElementById("saleDayDeltaLabel");
    this.todayDeltaEl = document.getElementById("todayDelta");
    this.todayDeltaCard = document.getElementById("todayDeltaCard");
    this.todayDeltaHeader = document.getElementById("todayDeltaHeader");
    this.todayDeltaLabel = document.getElementById("todayDeltaLabel");
    this.deltaChartCanvas = document.getElementById("deltaChart");
    this.rateChartCanvas = document.getElementById("rateChart");

    if (this.settings.saleDate)
      this.saleDateInput.value = this.settings.saleDate;
    if (this.settings.usdAmount)
      this.usdAmountInput.value = this.settings.usdAmount;
    if (this.settings.commission != null)
      this.commissionInput.value = this.settings.commission;
  }

  bindEvents() {
    this.updateButton.addEventListener("click", () => this.updateSettings());
    setInterval(() => this.updateCurrentData(), 5 * 60 * 1000);
  }

  loadSettings() {
    const saved = localStorage.getItem("currencyMonitorSettings");
    const defaults = {
      saleDate: null,
      usdAmount: null,
      saleDateRate: null,
      commission: 2,
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  }

  saveSettings() {
    localStorage.setItem(
      "currencyMonitorSettings",
      JSON.stringify(this.settings)
    );
  }

  getCommissionMultiplier() {
    return 1 - this.settings.commission / 100;
  }

  async updateSettings() {
    const saleDate = this.saleDateInput.value;
    const usdAmount = parseFloat(this.usdAmountInput.value);
    const commission = parseFloat(this.commissionInput.value);

    if (!saleDate || !usdAmount || usdAmount <= 0) {
      alert("Please enter valid sale date and USD amount");
      return;
    }

    if (isNaN(commission) || commission < 0 || commission > 100) {
      alert("Please enter a valid commission (0-100%)");
      return;
    }

    this.settings.saleDate = saleDate;
    this.settings.usdAmount = usdAmount;
    this.settings.commission = commission;

    try {
      const saleDateRate = await this.getHistoricalRate(saleDate);
      this.settings.saleDateRate = saleDateRate;
      this.saveSettings();

      await this.updateCurrentData();
      await this.updateCharts();

      this.showSuccess("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Error fetching exchange rate data. Please try again.");
    }
  }

  async loadInitialData() {
    if (
      this.settings.saleDate &&
      this.settings.usdAmount &&
      this.settings.saleDateRate
    ) {
      await this.updateCurrentData();
      await this.updateCharts();
    }
  }

  async getCurrentRate() {
    const response = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EUR"
    );
    const data = await response.json();
    return { rate: data.rates.EUR, date: data.date };
  }

  async getHistoricalRate(date) {
    const response = await fetch(
      `https://api.frankfurter.app/${date}?from=USD&to=EUR`
    );
    const data = await response.json();
    return data.rates.EUR;
  }

  async getHistoricalRates(startDate, endDate) {
    const response = await fetch(
      `https://api.frankfurter.app/${startDate}..${endDate}?from=USD&to=EUR`
    );
    const data = await response.json();
    return data.rates;
  }

  calculateDelta(rate) {
    const basePrice = this.settings.usdAmount * this.settings.saleDateRate;
    return (
      this.settings.usdAmount * rate * this.getCommissionMultiplier() -
      basePrice
    );
  }

  async updateCurrentData() {
    if (
      !this.settings.saleDate ||
      !this.settings.usdAmount ||
      !this.settings.saleDateRate
    )
      return;

    try {
      const { rate: currentRate } = await this.getCurrentRate();
      const commissionPct = this.settings.commission;
      const multiplier = this.getCommissionMultiplier();

      const basePrice = this.settings.usdAmount * this.settings.saleDateRate;
      const saleDayDelta = basePrice * multiplier - basePrice;
      const todayDelta = this.calculateDelta(currentRate);
      const deltaPercentage = (todayDelta / basePrice) * 100;

      this.basePriceEl.textContent = `${basePrice.toFixed(2)} EUR`;
      this.saleDayDeltaEl.textContent = `${saleDayDelta.toFixed(2)} EUR`;
      this.saleDayDeltaLabel.textContent = `Commission impact (-${commissionPct}%)`;

      this.todayDeltaEl.textContent = `${
        todayDelta >= 0 ? "+" : ""
      }${todayDelta.toFixed(2)} EUR (${deltaPercentage.toFixed(2)}%)`;

      if (todayDelta >= 0) {
        this.todayDeltaCard.className =
          "stat-card success-card rounded-2xl p-5";
        this.todayDeltaEl.className = "text-2xl font-bold text-white";
        this.todayDeltaHeader.className =
          "text-white/70 text-xs uppercase tracking-wider mb-2";
        this.todayDeltaLabel.className = "text-white/60 text-sm mt-1";
        this.todayDeltaLabel.textContent = "✓ Safe to convert";
      } else {
        this.todayDeltaCard.className = "stat-card alert-card rounded-2xl p-5";
        this.todayDeltaEl.className = "text-2xl font-bold text-white";
        this.todayDeltaHeader.className =
          "text-white/70 text-xs uppercase tracking-wider mb-2";
        this.todayDeltaLabel.className = "text-white/60 text-sm mt-1";
        this.todayDeltaLabel.textContent = "✗ Wait for better rate";
      }
    } catch (error) {
      console.error("Error updating current data:", error);
    }
  }

  async updateCharts() {
    if (
      !this.settings.saleDate ||
      !this.settings.usdAmount ||
      !this.settings.saleDateRate
    )
      return;

    try {
      const { rate: currentRate, date: todayDate } =
        await this.getCurrentRate();
      const rates = await this.getHistoricalRates(
        this.settings.saleDate,
        todayDate
      );

      const chartData = {
        [this.settings.saleDate]: { EUR: this.settings.saleDateRate },
        ...rates,
      };
      if (!chartData[todayDate]) chartData[todayDate] = { EUR: currentRate };

      const sortedDates = Object.keys(chartData).sort();
      const deltaData = sortedDates.map((date) => ({
        date,
        delta: this.calculateDelta(chartData[date].EUR),
        rate: chartData[date].EUR,
      }));

      this.renderDeltaChart(deltaData);
      this.renderRateChart(deltaData);
    } catch (error) {
      console.error("Error updating charts:", error);
    }
  }

  getBreakevenRate() {
    return this.settings.saleDateRate / this.getCommissionMultiplier();
  }

  renderDeltaChart(data) {
    const ctx = this.deltaChartCanvas.getContext("2d");
    if (this.deltaChart) this.deltaChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(134, 239, 172, 0.35)");
    gradient.addColorStop(1, "rgba(134, 239, 172, 0)");

    this.deltaChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.date),
        datasets: [
          {
            label: "Delta (EUR)",
            data: data.map((d) => d.delta),
            borderColor: "rgb(134, 239, 172)",
            backgroundColor: gradient,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "rgb(134, 239, 172)",
          },
          {
            label: "Zero Line",
            data: data.map(() => 0),
            borderColor: "rgba(255, 255, 255, 0.4)",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: this.getChartOptions(),
    });
  }

  renderRateChart(data) {
    const ctx = this.rateChartCanvas.getContext("2d");
    if (this.rateChart) this.rateChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(147, 197, 253, 0.35)");
    gradient.addColorStop(1, "rgba(147, 197, 253, 0)");

    const breakevenRate = this.getBreakevenRate();

    this.rateChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.date),
        datasets: [
          {
            label: "USD/EUR Rate",
            data: data.map((d) => d.rate),
            borderColor: "rgb(147, 197, 253)",
            backgroundColor: gradient,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "rgb(147, 197, 253)",
          },
          {
            label: `Breakeven (${breakevenRate.toFixed(4)})`,
            data: data.map(() => breakevenRate),
            borderColor: "rgba(253, 224, 71, 0.8)",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: this.getChartOptions(true),
    });
  }

  getChartOptions(showLegend = false) {
    return {
      responsive: true,
      interaction: { intersect: false, mode: "index" },
      scales: {
        y: {
          grid: { color: "rgba(134, 239, 172, 0.08)" },
          ticks: { color: "rgba(209, 250, 229, 0.6)" },
        },
        x: {
          grid: { color: "rgba(134, 239, 172, 0.08)" },
          ticks: { color: "rgba(209, 250, 229, 0.6)", maxTicksLimit: 8 },
        },
      },
      plugins: {
        legend: {
          display: showLegend,
          labels: { color: "rgba(209, 250, 229, 0.8)", boxWidth: 12 },
        },
        tooltip: {
          backgroundColor: "rgba(6, 35, 21, 0.95)",
          titleColor: "#fff",
          bodyColor: "rgb(209, 250, 229)",
          borderColor: "rgba(134, 239, 172, 0.3)",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          filter: (item) => item.datasetIndex === 0,
        },
      },
    };
  }

  showSuccess(message) {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-gradient-to-r from-fidelity-600 to-fidelity-700 text-white px-5 py-3 rounded-xl shadow-lg z-50 font-medium";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => new CurrencyMonitor());
