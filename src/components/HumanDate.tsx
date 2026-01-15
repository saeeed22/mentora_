import React from "react";

function HumanDate({ timestamp }: { timestamp: number }) {
  const humanizeDate = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();

    const diff = now.getTime() - date.getTime(); // difference in ms
    const oneDay = 24 * 60 * 60 * 1000;

    // "Now" if less than 1 minute
    if (diff < 60 * 1000) return "Now";

    // "Today"
    if (date.toDateString() === now.toDateString()) return "Today";

    // "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    // Else normal date
    return date.toLocaleDateString(); // customize format if needed
  };

  return <span>{humanizeDate(timestamp)}</span>;
}

export default HumanDate;