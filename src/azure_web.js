import React, { useEffect, useState, useMemo } from "react";

// Student details as specified in the assignment
const STUDENT_NAME = "HARI PRANEETHA M";
const ROLL_NUMBER = "24EIR038";

// Default API URL (Backend runs on port 5000)
const DEFAULT_API_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api/latest";

/**
 * Converts a string of ASCII codes or array into a readable string
 * e.g. "72, 101, 108, 108, 111" -> "Hello"
 */
function decodeAsciiString(asciiStr) {
  if (!asciiStr) return { asciiList: [], text: "" };
  const parts = String(asciiStr)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const asciiList = [];
  let text = "";

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      asciiList.push(num);
      text += String.fromCharCode(num);
    }
  }

  return { asciiList, text };
}

/**
 * Converts text into ASCII integer array
 */
function textToAsciiArray(str) {
  if (!str) return [];
  return Array.from(str).map((c) => c.charCodeAt(0));
}

export default function AzureWeb() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showConfig, setShowConfig] = useState(false);

  // Live telemetry state
  const [status, setStatus] = useState("CONNECTING");
  const [receivedAscii, setReceivedAscii] = useState("");
  const [convertedString, setConvertedString] = useState("Waiting for Azure telemetry...");
  const [timestamp, setTimestamp] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Interactive Demonstration state
  const [demoInput, setDemoInput] = useState("72, 101, 108, 108, 111");

  // Fetch telemetry continuously
  useEffect(() => {
    let active = true;

    async function fetchTelemetry() {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();

        if (active) {
          let asciiStr = "";
          let decodedText = "";

          if (data.ascii_string) {
            asciiStr = data.ascii_string;
            decodedText = data.converted_string || data.message || "";
          } else if (Array.isArray(data.ascii_values) && data.ascii_values.length > 0) {
            asciiStr = data.ascii_values.join(", ");
            decodedText = data.converted_string || data.message || "";
          } else if (data.message) {
            decodedText = data.message;
            const codes = textToAsciiArray(data.message);
            asciiStr = codes.join(", ");
          }

          setReceivedAscii(asciiStr);
          setConvertedString(decodedText || "Waiting for Azure telemetry...");
          setTimestamp(data.timestamp || null);
          setStatus("CONNECTED");
          setLastUpdated(new Date());

          // Append to history if new event
          if (data.timestamp) {
            setHistory((prev) => {
              if (prev.length > 0 && prev[0].timestamp === data.timestamp) {
                return prev;
              }
              const item = {
                timestamp: data.timestamp,
                ascii: asciiStr,
                text: decodedText,
              };
              return [item, ...prev.slice(0, 7)];
            });
          }
        }
      } catch (err) {
        if (active) {
          setStatus("DISCONNECTED");
        }
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [apiUrl]);

  // Break down current received ASCII into character mapping for demonstration
  const liveMapping = useMemo(() => {
    const { asciiList } = decodeAsciiString(receivedAscii);
    return asciiList.map((code) => ({
      code,
      char: code === 32 ? "␣ (space)" : String.fromCharCode(code),
    }));
  }, [receivedAscii]);

  // Demo interactive mapping
  const demoDecoded = useMemo(() => {
    return decodeAsciiString(demoInput);
  }, [demoInput]);

  const statusColor =
    status === "CONNECTED"
      ? "#22c55e"
      : status === "CONNECTING"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.badgeRow}>
              <span style={styles.azureTag}>AZURE IOT HUB</span>
              <span style={styles.subTag}>LIVE TELEMETRY MONITOR</span>
            </div>
            <h1 style={styles.mainHeading}>IoT Hub Integration & Debugging</h1>
          </div>

          {/* Student Information Banner */}
          <div style={styles.studentCard}>
            <div style={styles.studentRow}>
              <span style={styles.metaLabel}>STUDENT NAME</span>
              <strong style={styles.studentName}>{STUDENT_NAME}</strong>
            </div>
            <div style={styles.studentRow}>
              <span style={styles.metaLabel}>ROLL NUMBER</span>
              <strong style={styles.studentRoll}>{ROLL_NUMBER}</strong>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.container}>
        {/* Top Status & Controls Bar */}
        <section style={styles.statusBanner}>
          <div style={styles.statusIndicator}>
            <span
              style={{
                ...styles.dot,
                background: statusColor,
                boxShadow: `0 0 12px ${statusColor}`,
              }}
            />
            <span style={styles.statusLabel}>CONNECTION STATUS:</span>
            <span style={{ ...styles.statusValue, color: statusColor }}>
              {status}
            </span>
          </div>

          <div style={styles.apiActions}>
            <span style={styles.apiText}>
              Backend: <code>{apiUrl}</code>
            </span>
            <button
              onClick={() => setShowConfig(!showConfig)}
              style={styles.configBtn}
            >
              {showConfig ? "Hide Config" : "Change API URL"}
            </button>
          </div>
        </section>

        {showConfig && (
          <div style={styles.configPanel}>
            <label style={styles.inputLabel}>Backend API Endpoint URL:</label>
            <div style={styles.inputGroup}>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                style={styles.urlInput}
                placeholder="http://127.0.0.1:5000/api/latest"
              />
              <button
                onClick={() => setApiUrl(DEFAULT_API_URL)}
                style={styles.resetBtn}
              >
                Reset Default
              </button>
            </div>
          </div>
        )}

        {/* Core Telemetry Cards Grid */}
        <div style={styles.grid}>
          {/* Card 1: Received ASCII Values */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIcon}>🔢</div>
              <div>
                <h2 style={styles.cardTitle}>Received ASCII Values</h2>
                <p style={styles.cardSubtitle}>
                  Raw integer telemetry codes received from Azure IoT Hub
                </p>
              </div>
            </div>

            <div style={styles.codeBlock}>
              <code>{receivedAscii || "Waiting for ASCII telemetry stream..."}</code>
            </div>

            <div style={styles.cardFooter}>
              <span>Data format: Decimal ASCII byte sequence</span>
              <span>Codes count: {liveMapping.length}</span>
            </div>
          </div>

          {/* Card 2: Converted String */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIcon}>🔤</div>
              <div>
                <h2 style={styles.cardTitle}>Converted String</h2>
                <p style={styles.cardSubtitle}>
                  String decoded from ASCII codes (char = String.fromCharCode(code))
                </p>
              </div>
            </div>

            <div style={styles.decodedDisplay}>
              <p style={styles.decodedText}>
                {convertedString || "Waiting for decoded message..."}
              </p>
            </div>

            <div style={styles.cardFooter}>
              <span>Status: {status === "CONNECTED" ? "Live stream active" : "Waiting for connection"}</span>
              <span>Characters: {convertedString.length}</span>
            </div>
          </div>
        </div>

        {/* Live Conversion Mapping Demonstration */}
        <section style={styles.cardFull}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>🔬</div>
            <div>
              <h2 style={styles.cardTitle}>
                Live ASCII $\rightarrow$ String Conversion Demonstration
              </h2>
              <p style={styles.cardSubtitle}>
                Byte-by-byte demonstration translating each ASCII integer into its UTF-8 character
              </p>
            </div>
          </div>

          {liveMapping.length > 0 ? (
            <div style={styles.chipsContainer}>
              {liveMapping.map((item, idx) => (
                <div key={idx} style={styles.chip}>
                  <span style={styles.chipAscii}>{item.code}</span>
                  <span style={styles.chipArrow}>&darr;</span>
                  <span style={styles.chipChar}>{item.char}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.noData}>No telemetry bytes mapped yet.</p>
          )}

          <div style={styles.divider} />

          {/* Interactive ASCII Tester Demonstration */}
          <div style={styles.demoSection}>
            <div style={styles.demoHeader}>
              <h3 style={styles.demoTitle}>Interactive Conversion Verification</h3>
              <div style={styles.presetButtons}>
                <button
                  style={styles.presetBtn}
                  onClick={() => setDemoInput("72, 101, 108, 108, 111")}
                >
                  Load Example: "Hello" (72, 101, 108, 108, 111)
                </button>
                <button
                  style={styles.presetBtn}
                  onClick={() =>
                    setDemoInput("72, 65, 82, 73, 32, 80, 82, 65, 78, 69, 69, 84, 72, 65")
                  }
                >
                  Load Name: "HARI PRANEETHA"
                </button>
              </div>
            </div>

            <div style={styles.demoForm}>
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Enter comma-separated ASCII codes e.g. 72, 101, 108, 108, 111"
                style={styles.demoInput}
              />
              <div style={styles.demoOutput}>
                <span style={styles.demoOutputLabel}>Resulting String:</span>
                <span style={styles.demoOutputText}>
                  "{demoDecoded.text}"
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Event Timestamp and Metadata */}
        <section style={styles.metaGrid}>
          <div style={styles.metaCard}>
            <span style={styles.metaHeading}>LAST EVENT TIMESTAMP</span>
            <div style={styles.timestampDisplay}>
              {timestamp ? new Date(timestamp).toLocaleString() : "No events received"}
            </div>
            <div style={styles.timestampSub}>
              ISO UTC: <code>{timestamp || "N/A"}</code>
            </div>
          </div>

          <div style={styles.metaCard}>
            <span style={styles.metaHeading}>CLIENT POLLING STATUS</span>
            <div style={styles.timestampDisplay}>
              {lastUpdated ? lastUpdated.toLocaleTimeString() : "Pending"}
            </div>
            <div style={styles.timestampSub}>
              Interval: <code>1500 ms</code> | Auto-sync enabled
            </div>
          </div>
        </section>

        {/* Event Log / History Table */}
        {history.length > 0 && (
          <section style={styles.cardFull}>
            <h3 style={styles.tableTitle}>Recent Azure Telemetry Events Log</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Timestamp</th>
                    <th style={styles.th}>Received ASCII Values</th>
                    <th style={styles.th}>Converted String</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={styles.tdTime}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={styles.tdAscii}>
                        <code>{item.ascii}</code>
                      </td>
                      <td style={styles.tdText}>
                        <strong>{item.text}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <p>Azure IoT Hub &bull; Flask &bull; React &bull; Kongu Engineering College</p>
        <p style={{ marginTop: "4px", color: "#666" }}>
          Student: {STUDENT_NAME} ({ROLL_NUMBER})
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#090d16",
    color: "#f3f4f6",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: "0 0 60px 0",
  },
  header: {
    backgroundColor: "#0d1424",
    borderBottom: "1px solid #1f293d",
    padding: "28px 24px",
  },
  headerContent: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  },
  azureTag: {
    backgroundColor: "#0284c7",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
    padding: "3px 8px",
    borderRadius: "4px",
  },
  subTag: {
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "1px",
  },
  mainHeading: {
    margin: 0,
    fontSize: "clamp(22px, 3.5vw, 32px)",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  studentCard: {
    backgroundColor: "#162035",
    border: "1px solid #2d3e5e",
    borderRadius: "10px",
    padding: "14px 20px",
    display: "flex",
    gap: "28px",
  },
  studentRow: {
    display: "flex",
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "600",
    letterSpacing: "1px",
    marginBottom: "4px",
  },
  studentName: {
    fontSize: "16px",
    color: "#38bdf8",
    letterSpacing: "0.5px",
  },
  studentRoll: {
    fontSize: "16px",
    color: "#a78bfa",
    letterSpacing: "1px",
  },
  container: {
    maxWidth: "1100px",
    margin: "30px auto",
    padding: "0 20px",
  },
  statusBanner: {
    backgroundColor: "#131b2e",
    border: "1px solid #1f2d47",
    borderRadius: "10px",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "24px",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    display: "inline-block",
  },
  statusLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8",
    letterSpacing: "1px",
  },
  statusValue: {
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "1px",
  },
  apiActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  apiText: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  configBtn: {
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    border: "1px solid #334155",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  configPanel: {
    backgroundColor: "#131b2e",
    border: "1px solid #1f2d47",
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "24px",
  },
  inputLabel: {
    fontSize: "12px",
    color: "#cbd5e1",
    display: "block",
    marginBottom: "8px",
  },
  inputGroup: {
    display: "flex",
    gap: "10px",
  },
  urlInput: {
    flex: 1,
    backgroundColor: "#0a0f1d",
    border: "1px solid #27354f",
    color: "#f8fafc",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "monospace",
  },
  resetBtn: {
    backgroundColor: "#334155",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  card: {
    backgroundColor: "#131b2e",
    border: "1px solid #1f2d47",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardFull: {
    backgroundColor: "#131b2e",
    border: "1px solid #1f2d47",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },
  cardHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  cardIcon: {
    fontSize: "24px",
    backgroundColor: "#1e293b",
    padding: "8px 10px",
    borderRadius: "8px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 4px 0",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
  },
  codeBlock: {
    backgroundColor: "#090d16",
    border: "1px solid #222f47",
    borderRadius: "8px",
    padding: "16px",
    minHeight: "80px",
    display: "flex",
    alignItems: "center",
    wordBreak: "break-all",
    color: "#38bdf8",
    fontSize: "15px",
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  },
  decodedDisplay: {
    backgroundColor: "#090d16",
    border: "1px solid #222f47",
    borderRadius: "8px",
    padding: "16px",
    minHeight: "80px",
    display: "flex",
    alignItems: "center",
  },
  decodedText: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#4ade80",
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    wordBreak: "break-all",
  },
  cardFooter: {
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#64748b",
  },
  chipsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    margin: "16px 0",
    maxHeight: "220px",
    overflowY: "auto",
    padding: "4px",
  },
  chip: {
    backgroundColor: "#0a0f1d",
    border: "1px solid #27354f",
    borderRadius: "8px",
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "48px",
  },
  chipAscii: {
    fontSize: "12px",
    color: "#38bdf8",
    fontFamily: "monospace",
    fontWeight: "700",
  },
  chipArrow: {
    fontSize: "10px",
    color: "#64748b",
    margin: "2px 0",
  },
  chipChar: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#f8fafc",
  },
  noData: {
    color: "#64748b",
    fontSize: "14px",
    padding: "20px 0",
  },
  divider: {
    height: "1px",
    backgroundColor: "#1f2d47",
    margin: "20px 0",
  },
  demoSection: {
    marginTop: "10px",
  },
  demoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "12px",
  },
  demoTitle: {
    margin: 0,
    fontSize: "14px",
    color: "#cbd5e1",
    fontWeight: "600",
  },
  presetButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  presetBtn: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#93c5fd",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    cursor: "pointer",
  },
  demoForm: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  demoInput: {
    backgroundColor: "#0a0f1d",
    border: "1px solid #27354f",
    color: "#f8fafc",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "monospace",
  },
  demoOutput: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#0d1527",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px dashed #27354f",
  },
  demoOutputLabel: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  demoOutputText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#34d399",
    fontFamily: "monospace",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  metaCard: {
    backgroundColor: "#131b2e",
    border: "1px solid #1f2d47",
    borderRadius: "12px",
    padding: "20px",
  },
  metaHeading: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "1px",
    display: "block",
    marginBottom: "8px",
  },
  timestampDisplay: {
    fontSize: "17px",
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: "6px",
  },
  timestampSub: {
    fontSize: "12px",
    color: "#64748b",
  },
  tableTitle: {
    margin: "0 0 16px 0",
    fontSize: "16px",
    color: "#ffffff",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    backgroundColor: "#0d1527",
    color: "#94a3b8",
    fontWeight: "600",
    borderBottom: "1px solid #1f2d47",
  },
  tr: {
    borderBottom: "1px solid #162035",
  },
  tdTime: {
    padding: "10px 12px",
    color: "#cbd5e1",
    whiteSpace: "nowrap",
  },
  tdAscii: {
    padding: "10px 12px",
    color: "#38bdf8",
    fontFamily: "monospace",
  },
  tdText: {
    padding: "10px 12px",
    color: "#4ade80",
    fontFamily: "monospace",
  },
  footer: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "13px",
    color: "#64748b",
  },
};
