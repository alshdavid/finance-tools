import { h, render, Fragment } from "preact";
import { useState } from "preact/hooks";
import { useEffect } from "react";
import Chart from "chart.js/auto";

type Row = {
  age: number;
  capital: number;
  withdraw: number;
  balance: number;
  growth: number;
  eoyBalance: number;
  gross: number;
};

function App() {
  const [fundSize, setFundSize] = useState(2000000);
  const [growth, setGrowth] = useState(8);
  const [superBalance, setSuperBalance] = useState(0);
  const [inflation, setInflation] = useState(2);
  const [startingAge, setStartingAge] = useState(30);
  const [endAge, setEndAge] = useState(90);
  const [endBalance, setEndBalance] = useState(0);

  const rows = calculateEndBalance({
    endBalance,
    fundSize,
    growth,
    superBalance,
    inflation,
    startingAge,
    endAge,
  });

  const labels = range(startingAge, endAge);
  const datasets = [
    {
      data: [] as Array<number>,
      fill: false,
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1,
    },
  ];
  for (const row of rows) {
    datasets[0].data.push(row.eoyBalance)
  }

  const perYear = rows[0]?.withdraw || 0;
  const perMonth = Math.round(perYear / 12);
  const perWeek = Math.round(perYear / 52);

  return (
    <Fragment>
      <section className="content-max-width top">
        <form>
          <header>Params</header>

          <label>
            <span>Fund Size</span>
            <input
              type="text"
              name="fundSize"
              placeholder="Fund Size"
              onInput={onNumberInput(setFundSize)}
              defaultValue={fundSize}
            />
          </label>

          <label>
            <span>Growth %</span>
            <input
              type="text"
              name="growth"
              placeholder="Growth %"
              onInput={onNumberInput(setGrowth)}
              value={growth}
            />
          </label>

          <label>
            <span>Super Balance</span>
            <input
              type="text"
              name="superBalance"
              placeholder="Super Balance"
              onInput={onNumberInput(setSuperBalance)}
              value={superBalance}
            />
          </label>

          <label>
            <span>Inflation %</span>
            <input
              type="text"
              name="inflation"
              placeholder="Inflation %"
              onInput={onNumberInput(setInflation)}
              value={inflation}
            />
          </label>

          <label>
            <span>Starting Age</span>
            <input
              type="text"
              name="startingAge"
              placeholder="Starting Age"
              onInput={onNumberInput(setStartingAge)}
              value={startingAge}
            />
          </label>

          <label>
            <span>End Age</span>
            <input
              type="text"
              name="liveUntil"
              placeholder="Live until"
              onInput={onNumberInput(setEndAge)}
              value={endAge}
            />
          </label>

          <label>
            <span>
              End Balance
              {/* <input type="checkbox" name="" id="" /> */}
            </span>
            <input
              type="text"
              name="endBalance"
              placeholder="End Balance"
              onInput={onNumberInput(setEndBalance)}
              value={endBalance}
            />
          </label>

          <header>
            Withdraw
          </header>

          <label>
            <span>Per Year</span>
            <input
              type="text"
              name="perYear"
              placeholder="Per Year"
              disabled={true}
              value={perYear}
            />
          </label>

          <label>
            <span>Per Month</span>
            <input
              type="text"
              name="perMonth"
              placeholder="Per Month"
              disabled={true}
              value={perMonth}
            />
          </label>

          <label>
            <span>Per Week</span>
            <input
              type="text"
              name="perWeek"
              placeholder="Per Week"
              disabled={true}
              value={perWeek}
            />
          </label>
        </form>

        <div className="chart-container">
          <LineChart datasets={datasets} labels={labels} />
        </div>
      </section>
      <section className="content-max-width bottom">
        <table>
          <tr>
            <th>Age</th>
            <th>Capital</th>
            <th>Withdraw</th>
            <th>Balance</th>
            <th>Growth</th>
            <th>EOY Balance</th>
            <th>Gross</th>
          </tr>
          {rows.map((row) => (
            <tr className={row.gross > 0 ? "green" : "red"}>
              <td>{Math.round(row.age)}</td>
              <td>{Math.round(row.capital).toLocaleString()}</td>
              <td>{Math.round(row.withdraw).toLocaleString()}</td>
              <td>{Math.round(row.balance).toLocaleString()}</td>
              <td>{Math.round(row.growth).toLocaleString()}</td>
              <td>{Math.round(row.eoyBalance).toLocaleString()}</td>
              <td>{Math.round(row.gross).toLocaleString()}</td>
            </tr>
          ))}
        </table>
      </section>
    </Fragment>
  );
}

function onNumberInput(callback: (value: any) => any) {
  return (event: any) => {
    callback(parseNumber(event.target.value));
  };
}

function parseNumber(input: string | number): number {
  if (!input) {
    return 0;
  }
  if (typeof input === "number") {
    return input;
  }
  return parseInt(input, 10);
}

type CalculateOptions = {
  fundSize: number;
  growth: number;
  superBalance: number;
  inflation: number;
  withdraw: number;
  startingAge: number;
  endAge: number;
};

function calculate({
  fundSize,
  growth,
  superBalance,
  inflation,
  withdraw,
  startingAge,
  endAge,
}: CalculateOptions): Array<Row> {
  try {
    const rows: Array<Row> = [];

    for (let i = startingAge; i <= endAge; i++) {
      const yearsSinceStart = i - startingAge;
      const last = rows[yearsSinceStart - 1];

      const row = {
        age: i,
        capital: last ? last.eoyBalance : fundSize,
        withdraw: last
          ? last.withdraw + (last.withdraw * inflation) / 100
          : withdraw,
        balance: 0,
        growth: 0,
        eoyBalance: 0,
        gross: 0,
      };

      row.balance = row.capital - row.withdraw;
      row.growth = (row.balance * growth) / 100;

      row.eoyBalance = row.balance + row.growth;
      row.gross = row.eoyBalance - row.capital;

      if (row.eoyBalance >= 0) {
        rows.push(row);
      } else {
        rows.push({
          age: i,
          capital: 0,
          withdraw: 0,
          balance: 0,
          growth: 0,
          eoyBalance: 0,
          gross: 0,
        });
      }
    }

    return rows;
  } catch (error) {
    return [];
  }
}

function calculateEndBalance({
  endBalance,
  ...options
}: Omit<CalculateOptions, "withdraw"> & { endBalance: number }): Array<Row> {
  const stepSize = 500

  let current: Array<Row> = []

  // circuit breaker
  for (let r = 0; r < 4_000_000; r++) {
    const rows = calculate({
      withdraw: stepSize * r,
      ...options,
    })
    if (rows[rows.length - 1].eoyBalance <= 0) {
      return current
    }
    current = rows
  }


  return current;
}

function LineChart(props: any) {
  const [chart, setChart] = useState<null | Chart>(null);
  const [chartEl, setChartEl] = useState<null | HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartEl) return;

    const chart = new Chart(chartEl, {
      type: "line",
      data: {
        labels: props.labels || [],
        datasets: props.datasets || [],
      },
      options: {
        plugins: {
          title: {
            display: false,
          },
          legend: {
            display: false
          }
        },
        ...(props.options || {})
      },
    });

    setChart(chart);
    return () => chart.destroy();
  }, [chartEl]);

  useEffect(() => {
    if (!chart) return;
    if (props.labels) chart.data.labels = props.labels;
    if (props.datasets) chart.data.datasets = props.datasets;
    chart.update();
  }, [chart, props]);

  return <canvas ref={setChartEl}></canvas>;
}

function range(from?: number, to?: number): Array<number> {
  if (typeof from !== 'number') return []
  if (typeof to !== 'number') return []
  const arr: Array<number> = [];
  for (let i = from; i <= to; i++) arr.push(i)
  return arr
}

render(<App />, document.querySelector("body")!);
