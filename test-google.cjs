async function main() {
  const query = encodeURIComponent("Corn Tikki food");
  const url = `https://www.google.com/search?tbm=isch&q=${query}`;
  const response = await fetch(url, {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  const html = await response.text();
  const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/g)];
  const urls = imgMatches.map(m => m[1]).filter(u => u.startsWith('http') && !u.includes('favicon'));
  console.log(`Found ${urls.length} images`);
  console.log(urls.slice(0, 3));
}
main();
