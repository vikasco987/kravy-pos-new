async function main() {
  const query = encodeURIComponent("Corn Tikki dish food");
  const url = `https://images.search.yahoo.com/search/images?p=${query}`;
  console.log("Fetching", url);
  const response = await fetch(url, {
    headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  const html = await response.text();
  const imgMatches = [...html.matchAll(/<img[^>]+src=["'](https:\/\/[^"']+)["']/g)];
  console.log(`Found ${imgMatches.length} images`);
  if(imgMatches.length > 0) {
      console.log(imgMatches[0][1]);
      console.log(imgMatches[1]?.[1]);
  }
}
main();
