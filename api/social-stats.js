const fs = require('fs');
const path = require('path');
const https = require('https');

const YT_KEY = process.env.YT_KEY || '';
const YT_CHANNEL = process.env.YT_CHANNEL || 'UCOhEIzFSqQVifi-dAzyTBgw';
const RAPID_KEY = process.env.RAPID_KEY || '';
const RAPID_HOST = process.env.RAPID_HOST || 'instagram-scraper-ai3.p.rapidapi.com';

const statsPath = path.join(process.cwd(), 'social-stats.json');

function readStats() {
  try {
    if (fs.existsSync(statsPath)) {
      return JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Read stats error', error);
  }
  return {};
}

function writeStats(data) {
  try {
    fs.writeFileSync(statsPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Write stats error', error);
  }
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const json = raw ? JSON.parse(raw) : {};
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: json });
        } catch (error) {
          resolve({ ok: false, data: {} });
        }
      });
    }).on('error', () => {
      resolve({ ok: false, data: {} });
    });
  });
}

async function getYouTubeStats() {
  if (!YT_KEY) return {};
  const result = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${YT_CHANNEL}&key=${YT_KEY}`
  );

  if (!result.ok || !result.data.items || !result.data.items[0]) {
    return {};
  }

  const item = result.data.items[0];
  const stats = item.statistics || {};
  return {
    youtube: {
      subscribers: Number(stats.subscriberCount || 0),
      views: Number(stats.viewCount || 0),
      videos: Number(stats.videoCount || 0),
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
    }
  };
}

async function getInstagramStats() {
  if (!RAPID_KEY) return {};

  const body = new URLSearchParams({ username: 'ynshruthie' }).toString();
  const result = await fetchJson(
    `https://instagram-scraper-ai3.p.rapidapi.com/index.php?${body}`,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-rapidapi-host': RAPID_HOST,
      'x-rapidapi-key': RAPID_KEY,
    }
  );

  if (!result.ok) return {};

  const data = result.data || {};
  const acc = data.accountInfo || data.user || data;
  const ps = data.postsStatistics || {};

  return {
    instagram: {
      followers: Number(acc.followedByCount || acc.follower_count || acc.followers || 0),
      posts: Number(acc.mediaCount || acc.media_count || acc.posts || 0),
      reels: Number(acc.mediaCount || acc.media_count || acc.posts || 0),
      profilePicUrl: acc.profilePicUrl || '',
      totalLikes: Number(ps.likesCount || 0),
      totalComments: Number(ps.commentsCount || 0),
      avgReelViews: ps.averageCountOfLikes ? `${Number(ps.averageCountOfLikes).toLocaleString()}+` : '',
    }
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const stats = readStats();
  const liveStats = {
    ...stats,
    lastUpdated: new Date().toISOString(),
  };

  const youtubeStats = await getYouTubeStats();
  const instagramStats = await getInstagramStats();

  if (youtubeStats.youtube) {
    liveStats.youtube = { ...(liveStats.youtube || {}), ...youtubeStats.youtube };
  }

  if (instagramStats.instagram) {
    liveStats.instagram = { ...(liveStats.instagram || {}), ...instagramStats.instagram };
  }

  liveStats.global = liveStats.global || {};
  const totalFollowers = Number(liveStats.youtube?.subscribers || 0) + Number(liveStats.instagram?.followers || 0);
  liveStats.global.totalFollowers = `${Math.round(totalFollowers / 1000)}K+`;
  liveStats.global.avgEngagement = '12%+';

  writeStats(liveStats);
  res.status(200).json(liveStats);
};
