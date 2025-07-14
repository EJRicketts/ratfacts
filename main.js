// main.js
import { facts } from './facts.js';

// Render the current date in a human-friendly format
const dateEl = document.getElementById('date');
const today = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
dateEl.textContent = today.toLocaleDateString(undefined, options);

// helper to render a fact by index
function showFact(i) {
  document.getElementById('fact').innerText = facts[i];
}

// deterministic "fact of the day"
const idx = (
  today.getFullYear() * 365 +
  today.getMonth() * 31 +
  today.getDate()
) % facts.length;
showFact(idx);

// secret button functionality - random fact
document.getElementById('secretBtn').addEventListener('click', () => {
  const randomIdx = Math.floor(Math.random() * facts.length);
  showFact(randomIdx);
});

// secret button functionality - restore daily fact
document.getElementById('dateBtn').addEventListener('click', () => {
  showFact(idx);
});

// toggle rat stats when rat emojis are clicked
function toggleRatStats() {
  const ratStats = document.getElementById('ratStats');
  if (ratStats.style.display === 'none') {
    ratStats.style.display = 'block';
    fetchRatStats();
  } else {
    ratStats.style.display = 'none';
  }
}

document.getElementById('ratEmoji1').addEventListener('click', toggleRatStats);
document.getElementById('ratEmoji2').addEventListener('click', toggleRatStats);

// fetch live rat data from NYC Open Data API
async function fetchRatStats() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    
    // get same date last year for proper comparison
    const sameDateLastYear = new Date(previousYear, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    
    // optimized queries - get current year to date vs same period last year
    const currentYearUrl = `https://data.cityofnewyork.us/resource/3q43-55fe.json?$where=created_date>='${currentYear}-01-01T00:00:00'&$select=count(*)`;
    const lastYearUrl = `https://data.cityofnewyork.us/resource/3q43-55fe.json?$where=created_date>='${previousYear}-01-01T00:00:00' AND created_date<='${sameDateLastYear}T23:59:59'&$select=count(*)`;
    
    const [currentResponse, lastResponse] = await Promise.all([
      fetch(currentYearUrl),
      fetch(lastYearUrl)
    ]);
    
    if (!currentResponse.ok || !lastResponse.ok) {
      throw new Error('API request failed');
    }
    
    const currentData = await currentResponse.json();
    const lastData = await lastResponse.json();
    
    let currentCount = 0;
    let lastCount = 0;
    
    if (currentData && currentData[0] && currentData[0].count) {
      currentCount = parseInt(currentData[0].count);
      document.getElementById('nycRatCount').textContent = currentCount.toLocaleString();
    } else {
      document.getElementById('nycRatCount').textContent = 'N/A';
    }
    
    if (lastData && lastData[0] && lastData[0].count) {
      lastCount = parseInt(lastData[0].count);
      document.getElementById('nycRatCountPrev').textContent = lastCount.toLocaleString();
    } else {
      document.getElementById('nycRatCountPrev').textContent = 'N/A';
    }
    
    // calculate year-over-year change
    if (currentCount > 0 && lastCount > 0) {
      const change = currentCount - lastCount;
      const percentChange = ((change / lastCount) * 100).toFixed(1);
      
      const changeElement = document.getElementById('nycRatChange');
      const changeText = change > 0 ? `+${change.toLocaleString()} (+${percentChange}%)` : `${change.toLocaleString()} (${percentChange}%)`;
      
      changeElement.textContent = changeText;
      changeElement.className = change > 0 ? 'stat-value positive' : 'stat-value negative';
    } else {
      document.getElementById('nycRatChange').textContent = 'N/A';
    }
    
  } catch (error) {
    console.error('Rat stats error:', error);
    document.getElementById('nycRatCount').textContent = 'Unable to load';
    document.getElementById('nycRatCountPrev').textContent = 'Unable to load';
    document.getElementById('nycRatChange').textContent = 'Unable to load';
  }
}

// don't fetch rat stats on page load anymore - only when toggled
