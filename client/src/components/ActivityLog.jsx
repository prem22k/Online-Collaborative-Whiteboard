import { useRef, useEffect } from 'react';

const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function ActivityLog({ username, onUsernameChange, activityLog }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activityLog]);

  return (
    <div className="activity-log">
      <input
        type="text"
        placeholder="Your name..."
        value={username}
        onChange={(e) => onUsernameChange(e.target.value)}
      />
      <div className="log-box">
        {activityLog.length === 0 && (
          <div className="log-empty">No activity yet</div>
        )}
        {activityLog.map((entry, i) => (
          <div key={i} className="log-entry">
            <span className="log-timestamp">[{formatTime(new Date(entry.timestamp))}]</span>{' '}
            <strong>{entry.user}</strong> {entry.action}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
