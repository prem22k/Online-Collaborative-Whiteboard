import { useRef, useEffect } from 'react';

const styles = {
  container: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    flexShrink: 0,
  },
  input: {
    padding: '10px',
    fontSize: '15px',
    border: '1px solid #666',
    borderRadius: '6px',
    marginBottom: '10px',
    outline: 'none',
    minHeight: '44px',
  },
  logBox: {
    border: '1px solid #000',
    backgroundColor: '#fff',
    overflowY: 'auto',
    padding: '8px',
    height: '280px',
    maxHeight: '40vh',
  },
  entry: {
    fontSize: '13px',
    color: '#333',
    padding: '4px 0',
    borderBottom: '1px solid #eee',
    wordBreak: 'break-word',
  },
  timestamp: {
    color: '#999',
    fontSize: '12px',
  },
};

const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function ActivityLog({ username, onUsernameChange, activityLog }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activityLog]);

  return (
    <div style={styles.container}>
      <input
        style={styles.input}
        type="text"
        placeholder="Enter your name..."
        value={username}
        onChange={(e) => onUsernameChange(e.target.value)}
      />
      <div style={styles.logBox}>
        {activityLog.map((entry, i) => (
          <div key={i} style={styles.entry}>
            <span style={styles.timestamp}>[{formatTime(new Date(entry.timestamp))}]</span>{' '}
            <strong>{entry.user}</strong> {entry.action}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
