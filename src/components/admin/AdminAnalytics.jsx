import { useEffect, useState } from "react";
import { Button } from "./AdminUI";
const formatNumber = (value) => Number(value || 0).toLocaleString();
const duration = (value) =>
  Number(value) >= 60
    ? `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`
    : `${Math.round(Number(value) || 0)}s`;
function Breakdown({ title, rows = [], labelKey, valueKey = "count" }) {
  const maximum = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  return (
    <section className="cms-panel cms-breakdown">
      <h3>{title}</h3>
      {rows.length ? (
        rows.slice(0, 8).map((row, index) => (
          <div className="cms-breakdown-row" key={index}>
            <div>
              <span title={String(row[labelKey] || "Unknown")}>
                {row[labelKey] || "Unknown"}
              </span>
              <strong>{formatNumber(row[valueKey])}</strong>
            </div>
            <div className="cms-bar-track">
              <i
                style={{
                  width: `${(100 * (Number(row[valueKey]) || 0)) / maximum}%`,
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="cms-muted">No data for this period.</p>
      )}
    </section>
  );
}
function TrafficChart({ rows = [] }) {
  const max = Math.max(1, ...rows.map((row) => row.count || 0));
  const xy = rows.map((row, index) => [
    20 + (index * 760) / Math.max(1, rows.length - 1),
    160 - ((row.count || 0) / max) * 130,
  ]);
  return (
    <section className="cms-panel cms-traffic">
      <div className="cms-section-heading">
        <h3>Traffic over time</h3>
        <p>Page views recorded during the selected period.</p>
      </div>
      {rows.length ? (
        <>
          <svg
            viewBox="0 0 800 180"
            role="img"
            aria-label={`${rows.length} time intervals, ${rows.reduce((sum, row) => sum + (row.count || 0), 0)} total page views`}
          >
            <path
              d="M20 30H780 M20 95H780 M20 160H780"
              fill="none"
              stroke="#9fe9ff18"
            />
            <path
              d={`M${xy.map((pair) => pair.join(",")).join(" L")}`}
              fill="none"
              stroke="#9fe9ff"
              strokeWidth="3"
            />
            {xy.map(([cx, cy], index) => (
              <circle key={index} cx={cx} cy={cy} r="4" fill="#9fe9ff">
                <title>{rows[index].count} page views</title>
              </circle>
            ))}
          </svg>
          <div className="cms-chart-caption">
            <span>Earlier</span>
            <span>Most recent</span>
          </div>
        </>
      ) : (
        <div className="cms-chart-empty">
          Traffic will appear here as visitors explore your portfolio.
        </div>
      )}
    </section>
  );
}
export default function AdminAnalytics({ request }) {
  const [period, setPeriod] = useState("week"),
    [refresh, setRefresh] = useState(0),
    [visitors, setVisitors] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    request(`/visitor-analytics?period=${period}`, {
      signal: controller.signal,
    })
      .then(setVisitors)
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [request, period, refresh]);
  const summary = visitors?.summary || {};
  return (
    <div className="cms-analytics">
      <div className="cms-toolbar">
        <div
          className="cms-segmented"
          aria-label="Analytics period"
          role="group"
        >
          {["day", "week", "month", "year"].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={period === value}
              onClick={() => {
                setPeriod(value);
              }}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <Button
          icon="refresh"
          onClick={() => setRefresh((value) => value + 1)}
          disabled={loading}
        >
          Refresh analytics
        </Button>
      </div>
      {error && (
        <div className="cms-notice error" role="alert">
          {error}{" "}
          <button onClick={() => setRefresh((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}
      {loading && !visitors ? (
        <div className="cms-loading" role="status">
          Loading analytics…
        </div>
      ) : !visitors ? (
        <div className="cms-empty cms-panel">
          <h2>Analytics are unavailable</h2>
          <p>Try refreshing to load your visitor data.</p>
        </div>
      ) : (
        <>
          <div className="cms-stat-grid">
            {[
              ["Unique visitors", summary.uniqueVisitors, "Selected period"],
              ["Page views", summary.totalPageViews, "Selected period"],
              [
                "Returning visitors",
                summary.returningVisitors,
                "Selected period",
              ],
              [
                "Average visit",
                duration(summary.avgTimeOnPage),
                "Selected period",
              ],
            ].map(([label, value, note]) => (
              <div className="cms-stat" key={label}>
                <span>{label}</span>
                <strong>
                  {typeof value === "string" ? value : formatNumber(value)}
                </strong>
                <small>{note}</small>
              </div>
            ))}
          </div>

          <TrafficChart rows={visitors?.visitorsOverTime} />
          <div className="cms-breakdown-grid">
            <Breakdown
              title="Popular pages"
              rows={visitors?.pageViews}
              labelKey="page"
              valueKey="views"
            />
            <Breakdown
              title="Traffic sources"
              rows={visitors?.topReferrers}
              labelKey="referrer"
            />
            <Breakdown
              title="Devices"
              rows={visitors?.deviceStats}
              labelKey="device"
            />
            <Breakdown
              title="Browsers"
              rows={visitors?.browserStats}
              labelKey="browser"
            />
            <Breakdown
              title="Countries"
              rows={visitors?.countryStats}
              labelKey="country"
            />
            <Breakdown
              title="Languages"
              rows={visitors?.languageStats}
              labelKey="language"
            />
            <Breakdown
              title="Operating systems"
              rows={visitors?.osStats}
              labelKey="os"
            />
          </div>
          {visitors?.topVisitorsByTime?.length > 0 && (
            <details className="cms-panel cms-details">
              <summary>Visitors with the most time on site</summary>
              <div className="cms-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Visitor IP</th>
                      <th>Time on site</th>
                      <th>Page views</th>
                      <th>Pages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.topVisitorsByTime.map((row, index) => (
                      <tr key={index}>
                        <td>{row.ip}</td>
                        <td>{duration(row.totalTime)}</td>
                        <td>{row.pageViews}</td>
                        <td>{row.pages?.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
