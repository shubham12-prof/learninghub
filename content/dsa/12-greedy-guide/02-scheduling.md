# Scheduling

Greedy algorithms for choosing which tasks/jobs/meetings to schedule to maximize count, minimize resources, or meet deadlines.

## Activity Selection — maximize the number of non-overlapping activities

```javascript
function maxActivities(activities) {
  // activities: [[start, end], ...]
  activities.sort((a, b) => a[1] - b[1]); // sort by end time

  let count = 1;
  let lastEnd = activities[0][1];

  for (let i = 1; i < activities.length; i++) {
    if (activities[i][0] >= lastEnd) {
      // starts after (or when) the last one ends
      count++;
      lastEnd = activities[i][1];
    }
  }

  return count;
}

console.log(
  maxActivities([
    [1, 4],
    [3, 5],
    [0, 6],
    [5, 7],
    [3, 9],
    [5, 9],
    [6, 10],
    [8, 11],
    [8, 12],
    [2, 14],
    [12, 16],
  ]),
);
// 4
```

## Meeting Rooms — can one person attend all meetings?

```javascript
function canAttendAllMeetings(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) return false; // overlap found
  }

  return true;
}
```

## Meeting Rooms II — minimum rooms needed for all meetings to happen

```javascript
function minMeetingRooms(intervals) {
  const starts = intervals.map((i) => i[0]).sort((a, b) => a - b);
  const ends = intervals.map((i) => i[1]).sort((a, b) => a - b);

  let rooms = 0;
  let maxRooms = 0;
  let s = 0,
    e = 0;

  while (s < starts.length) {
    if (starts[s] < ends[e]) {
      rooms++; // a meeting starts before another ends -> need a new room
      s++;
    } else {
      rooms--; // a meeting ended -> free up a room
      e++;
    }
    maxRooms = Math.max(maxRooms, rooms);
  }

  return maxRooms;
}

console.log(
  minMeetingRooms([
    [0, 30],
    [5, 10],
    [15, 20],
  ]),
); // 2
```

## Job Sequencing with Deadlines — maximize profit, each job takes 1 unit of time

```javascript
function jobSequencing(jobs) {
  // jobs: [{ id, deadline, profit }, ...]
  jobs.sort((a, b) => b.profit - a.profit); // highest profit first

  const maxDeadline = Math.max(...jobs.map((j) => j.deadline));
  const slots = new Array(maxDeadline + 1).fill(null);
  let totalProfit = 0;

  for (const job of jobs) {
    // try to schedule as late as possible, at or before its deadline
    for (let t = job.deadline; t > 0; t--) {
      if (slots[t] === null) {
        slots[t] = job.id;
        totalProfit += job.profit;
        break;
      }
    }
  }

  return { totalProfit, schedule: slots };
}
```

## Complexity

Most scheduling problems: O(n log n) time (dominated by sorting), O(n) space.

## Where it shows up

Calendar/meeting room booking systems, CPU task scheduling, deadline-based job prioritization.
