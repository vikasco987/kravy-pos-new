async function main() {
  const query = encodeURIComponent("Corn Tikki food");
  const url = `https://www.bing.com/images/search?q=${query}&first=1`;
  const response = await fetch(url, {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  const html = await response.text();
  const matches = [...html.matchAll(/murl&quot;:&quot;(https:\/\/[^&]+)&quot;/g)];
  if (matches.length > 0) {
      console.log(`Found ${matches.length} images`);
      console.log(matches.slice(0, 3).map(m => m[1]));
  } else {
      console.log("No images found with murl regex. Let's try matching the full JSON metadata in m attribute.");
      const jsonMatches = [...html.matchAll(/m=\"(\{.*?\})\"/g)];
      console.log(`Found ${jsonMatches.length} json matches`);
      if (jsonMatches.length > 0) {
          console.log(JSON.parse(jsonMatches[0][1].replace(/&quot;/g, '"')));
      }
  }
}
main();
