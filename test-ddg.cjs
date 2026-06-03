async function main() {
  const query = "Corn Tikki food";
  
  // Step 1: Get vqd
  const res1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`);
  const html = await res1.text();
  const vqdMatch = html.match(/vqd=([\d-]+)/);
  if(!vqdMatch) {
      console.log("No VQD found");
      return;
  }
  const vqd = vqdMatch[1];
  console.log("VQD:", vqd);

  // Step 2: Fetch images
  const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}`;
  const res2 = await fetch(url, {
      headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
  });
  const json = await res2.json();
  console.log(`Found ${json.results?.length} images`);
  if(json.results && json.results.length > 0) {
      console.log(json.results[0].image);
  }
}
main();
