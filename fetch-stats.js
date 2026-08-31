const fs = require("fs");
const https = require("https");
const querystring = require("querystring");

const YT_KEY = process.env.YT_KEY || "";
const YT_CHANNEL = process.env.YT_CHANNEL || "UCOhEIzFSqQVifi-dAzyTBgw";
const RAPID_KEY = process.env.RAPID_KEY || "";
const RAPID_HOST = process.env.RAPID_HOST || "instagram-scraper-ai3.p.rapidapi.com";
const YT_CLIENT_ID = process.env.YT_CLIENT_ID || "";
const YT_CLIENT_SECRET = process.env.YT_CLIENT_SECRET || "";
const YT_REFRESH_TOKEN = process.env.YT_REFRESH_TOKEN || "";

const statsPath = "./social-stats.json";
let currentStats = fs.existsSync(statsPath) ? JSON.parse(fs.readFileSync(statsPath)) : {};
currentStats.lastUpdated = new Date().toISOString();

function saveStats() {
  fs.writeFileSync(statsPath, JSON.stringify(currentStats, null, 2));
  console.log("Social stats updated successfully.");
}

function fetchYouTube() {
  return new Promise((resolve) => {
    https.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${YT_CHANNEL}&key=${YT_KEY}`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            const s = json.items[0].statistics;
            currentStats.youtube = currentStats.youtube || {};
            currentStats.youtube.subscribers = parseInt(s.subscriberCount) || currentStats.youtube.subscribers;
            currentStats.youtube.views = parseInt(s.viewCount) || currentStats.youtube.views;
            currentStats.youtube.videos = parseInt(s.videoCount) || currentStats.youtube.videos;
          }
        } catch(e) { console.error("YouTube parse error", e); }
        resolve();
      });
    }).on("error", (e) => { console.error("YouTube error", e); resolve(); });
  });
}

function fetchInstagram() {
  return new Promise((resolve) => {
    const postData = querystring.stringify({ username: "ynshruthie" });
    const options = {
      hostname: RAPID_HOST, port: 443, path: "/index.php", method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
        "x-rapidapi-host": RAPID_HOST,
        "x-rapidapi-key": RAPID_KEY
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          currentStats.instagram = currentStats.instagram || {};
          const u = json.user || json;
          if (u.follower_count || u.followersCount || u.followers)
            currentStats.instagram.followers = parseInt(u.follower_count || u.followersCount || u.followers) || currentStats.instagram.followers;
          if (u.media_count || u.postsCount || u.posts)
            currentStats.instagram.posts = parseInt(u.media_count || u.postsCount || u.posts) || currentStats.instagram.posts;
        } catch(e) { console.error("Instagram parse error", e); }
        resolve();
      });
    });
    req.on("error", (e) => { console.error("Instagram error", e); resolve(); });
    req.write(postData);
    req.end();
  });
}

async function main() {
  await fetchYouTube();
  await fetchInstagram();

  currentStats.global = currentStats.global || {};
  let totalFoll = 0;
  if (currentStats.youtube && currentStats.youtube.subscribers) totalFoll += currentStats.youtube.subscribers;
  if (currentStats.instagram && currentStats.instagram.followers) totalFoll += currentStats.instagram.followers;
  currentStats.global.totalFollowers = Math.round(totalFoll / 1000) + "K+";
  currentStats.global.avgEngagement = "12%+";

  saveStats();
}

main();
