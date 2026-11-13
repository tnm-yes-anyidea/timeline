import fs from 'fs';
import path from 'path';

const INPUT_FILE = path.join(process.cwd(), 'british_pathe_by_year.json');
const OUT_DIR = path.join(process.cwd(), 'public', 'data');
const YEARS_DIR = path.join(OUT_DIR, 'years');

fs.mkdirSync(YEARS_DIR, { recursive: true });

let rawData = {};
if (fs.existsSync(INPUT_FILE)) {
  console.log('Found british_pathe_by_year.json! Splitting into static CDN chunks...');
  rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
} else {
  console.log('No british_pathe_by_year.json found in root. Generating starter sample...');
  rawData = {
    "1939": [
      { id: "LlyEIaRw010", year: 1939, title: "The Car Catcher Aka Motor Device (1939)", cleanTitle: "The Car Catcher Aka Motor Device", duration: 34, url: "https://www.youtube.com/watch?v=LlyEIaRw010", thumbnail: "https://i.ytimg.com/vi/LlyEIaRw010/hqdefault.jpg" },
      { id: "0Lqn0dEg64M", year: 1939, title: "Lost And Found Gas Masks (1939)", cleanTitle: "Lost And Found Gas Masks", duration: 41, url: "https://www.youtube.com/watch?v=0Lqn0dEg64M", thumbnail: "https://i.ytimg.com/vi/0Lqn0dEg64M/hqdefault.jpg" },
      { id: "a2oYStlkBgo", year: 1939, title: "Scrap For Britain (1939)", cleanTitle: "Scrap For Britain", duration: 33, url: "https://www.youtube.com/watch?v=a2oYStlkBgo", thumbnail: "https://i.ytimg.com/vi/a2oYStlkBgo/hqdefault.jpg" }
    ],
    "1945": [
      { id: "7IwQewHRl1I", year: 1945, title: "Mountbatten And Others Off Plane (1945)", cleanTitle: "Mountbatten And Others Off Plane", duration: 60, url: "https://www.youtube.com/watch?v=7IwQewHRl1I", thumbnail: "https://i.ytimg.com/vi/7IwQewHRl1I/hqdefault.jpg" }
    ],
    "1965": [
      { id: "s-TTHOP72Rs", year: 1965, title: "Brandenburg Gate (1965)", cleanTitle: "Brandenburg Gate", duration: 29, url: "https://www.youtube.com/watch?v=s-TTHOP72Rs", thumbnail: "https://i.ytimg.com/vi/s-TTHOP72Rs/hqdefault.jpg" }
    ]
  };
}

const yearsSummary = [];
let totalReels = 0;

const sortedYears = Object.keys(rawData)
  .map(Number)
  .filter((y) => !isNaN(y) && rawData[String(y)]?.length > 0)
  .sort((a, b) => a - b);

for (const year of sortedYears) {
  const videos = rawData[String(year)];

  videos.sort((a, b) => (a.cleanTitle || a.title).localeCompare(b.cleanTitle || b.title));

  fs.writeFileSync(
    path.join(YEARS_DIR, `${year}.json`),
    JSON.stringify(videos)
  );

  yearsSummary.push({ year, count: videos.length });
  totalReels += videos.length;
}

fs.writeFileSync(
  path.join(OUT_DIR, 'index.json'),
  JSON.stringify({ totalReels, years: yearsSummary })
);

console.log(`Prepared ${sortedYears.length} years (${totalReels} total newsreels) in public/data/`);
