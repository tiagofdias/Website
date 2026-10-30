import { useEffect, useState } from "react";
import { Button, Field, Icon, Modal } from "./AdminUI";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
const formatNumber = (value) => Number(value || 0).toLocaleString();
const date = (value) =>
  value && Number.isFinite(new Date(value).getTime())
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";
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
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [refresh, setRefresh] = useState(0),
    [visitors, setVisitors] = useState(null),
    [stats, setStats] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [conversation, setConversation] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(
      () =>
        Promise.all([
          request(`/visitor-analytics?period=${period}`, {
            signal: controller.signal,
          }),
          request(
            `/statistics?page=${page}&limit=20&search=${encodeURIComponent(search)}`,
            { signal: controller.signal },
          ),
        ])
          .then(([a, b]) => {
            setVisitors(a);
            setStats(b);
          })
          .catch((e) => {
            if (!controller.signal.aborted) setError(e.message);
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          }),
      search ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [request, period, page, search, refresh]);
  const summary = visitors?.summary || {},
    logs = stats?.chatLogs?.logs || [],
    pagination = stats?.chatLogs?.pagination || {},
    pages = Math.max(1, pagination.totalPages || 1);
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
                setPage(1);
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
      {loading && !stats ? (
        <div className="cms-loading" role="status">
          Loading analytics…
        </div>
      ) : !stats ? (
        <div className="cms-empty cms-panel">
          <h2>Analytics are unavailable</h2>
          <p>Try refreshing to load your visitor data and conversations.</p>
        </div>
      ) : (
        <>
          <div className="cms-stat-grid">
            {[
              ["Unique visitors", summary.uniqueVisitors, "Selected period"],
              ["Page views", summary.totalPageViews, "Selected period"],
              ["AI conversations", stats?.summary?.totalChats, "All time"],
              [
                "Average AI response",
                `${((stats?.summary?.avgResponseTime || 0) / 1000).toFixed(1)}s`,
                "All time",
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
          <div className="cms-health">
            <span
              className={`cms-status ${stats?.health?.status === "healthy" ? "published" : "hidden"}`}
            >
              {stats?.health?.status === "healthy"
                ? "Service healthy"
                : "Service status needs attention"}
            </span>
            <span>Last heartbeat: {date(stats?.health?.lastPing)}</span>
            <span>Average visit: {duration(summary.avgTimeOnPage)}</span>
            <span>
              Returning visitors: {formatNumber(summary.returningVisitors)}
            </span>
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
          <section className="cms-panel cms-conversations">
            <div className="cms-section-heading">
              <h3>AI conversations</h3>
              <p>
                Search questions and responses, then open a conversation to read
                it in full.
              </p>
            </div>
            <Field
              label="Search conversation logs"
              type="search"
              placeholder="Search question, answer, or visitor IP"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            {loading && (
              <p className="cms-help" role="status">
                Updating results…
              </p>
            )}
            {logs.length ? (
              <div className="cms-log-list">
                {logs.map((log) => (
                  <button
                    key={log._id}
                    className="cms-log-row"
                    onClick={() => setConversation(log)}
                  >
                    <span>
                      <strong>{log.userQuestion}</strong>
                      <small>
                        {date(log.timestamp)} · {log.ip || "Unknown visitor"}
                      </small>
                    </span>
                    <span>
                      {((log.responseTime || 0) / 1000).toFixed(1)}s{" "}
                      <Icon name="arrow" size={18} />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="cms-empty compact">
                <h3>No conversations found</h3>
                <p>
                  {search
                    ? "Try a different question or search term."
                    : "Live AI conversations will appear here."}
                </p>
              </div>
            )}
            <div className="cms-pagination">
              <span>
                {formatNumber(pagination.total)} conversations · Page {page} of{" "}
                {pages}
              </span>
              <div>
                <Button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  disabled={page >= pages || loading}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
      {conversation && (
        <Modal
          className="cms-conversation-modal"
          titleId="cms-conversation-title"
          onClose={() => setConversation(null)}
        >
          <header className="cms-modal-header">
            <div>
              <span className="cms-overline">CONVERSATION LOG</span>
              <h2 id="cms-conversation-title">Question & answer</h2>
            </div>
            <button
              className="cms-icon-button"
              aria-label="Close conversation"
              onClick={() => setConversation(null)}
            >
              <Icon name="close" />
            </button>
          </header>
          <div className="cms-modal-body">
            <p className="cms-muted">
              {date(conversation.timestamp)} · {conversation.ip}
            </p>
            <h3>Visitor question</h3>
            <p className="cms-preserve-text">{conversation.userQuestion}</p>
            <h3>Assistant response</h3>
            <div className="cms-log-answer">
              <ReactMarkdown
                remarkPlugins={[remarkBreaks]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {conversation.aiResponse}
              </ReactMarkdown>
            </div>
            {conversation.userAgent && (
              <details className="cms-details">
                <summary>Visitor device details</summary>
                <p className="cms-preserve-text">{conversation.userAgent}</p>
              </details>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
