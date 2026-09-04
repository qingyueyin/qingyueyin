const fs = require('fs');
const https = require('https');

const username = process.env.USERNAME;
const token = process.env.GITHUB_TOKEN;

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Authorization': `token ${token}` } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function getStats() {
  const user = await fetch(`https://api.github.com/users/${username}`);
  
  const repos = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
  
  let totalStars = 0;
  let totalForks = 0;
  for (const repo of repos) {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
  }
  
  const commits = await fetch(`https://api.github.com/search/commits?q=author:${username}`);
  const totalCommits = commits.total_count || 0;
  
  const prs = await fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr`);
  const totalPRs = prs.total_count || 0;
  
  const issues = await fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue`);
  const totalIssues = issues.total_count || 0;
  
  const joinDate = new Date(user.created_at);
  const now = new Date();
  const years = now.getFullYear() - joinDate.getFullYear();
  
  return {
    stars: totalStars,
    forks: totalForks,
    commits: totalCommits,
    prs: totalPRs,
    issues: totalIssues,
    repos: user.public_repos,
    followers: user.followers,
    years: years
  };
}

function generateSVG(stats) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280" viewBox="0 0 480 280">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F5C518;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF6B35;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="480" height="280" rx="12" fill="#0D1117"/>
  
  <text x="24" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="url(#grad)">${username}'s GitHub Stats</text>
  
  <line x1="24" y1="55" x2="456" y2="55" stroke="#30363D" stroke-width="1"/>
  
  <text x="24" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#8B949E">⭐ Total Stars Earned:</text>
  <text x="456" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#F5C518" text-anchor="end">${stats.stars}</text>
  
  <text x="24" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#8B949E">📊 Total Commits:</text>
  <text x="456" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#F5C518" text-anchor="end">${stats.commits.toLocaleString()}</text>
  
  <text x="24" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#8B949E">🔀 Total PRs:</text>
  <text x="456" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#F5C518" text-anchor="end">${stats.prs}</text>
  
  <text x="24" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#8B949E">🎯 Total Issues:</text>
  <text x="456" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#F5C518" text-anchor="end">${stats.issues}</text>
  
  <text x="24" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#8B949E">📦 Public Repos:</text>
  <text x="456" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#F5C518" text-anchor="end">${stats.repos}</text>
  
  <text x="24" y="265" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#8B949E">📅 Joined GitHub:</text>
  <text x="456" y="265" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#F5C518" text-anchor="end">${stats.years} years ago</text>
</svg>`;
}

async function main() {
  try {
    console.log('Fetching GitHub stats...');
    const stats = await getStats();
    console.log('Stats:', stats);
    
    const svg = generateSVG(stats);
    fs.writeFileSync('dist/github-stats.svg', svg);
    console.log('SVG generated successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
