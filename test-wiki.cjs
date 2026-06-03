async function main() {
  const query = "Pizza";
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}
main();
