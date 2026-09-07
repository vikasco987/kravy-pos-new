fetch("http://localhost:3000/api/items", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "krishna",
    sellingPrice: 149,
    categoryId: ""
  })
}).then(res => res.json()).then(console.log).catch(console.error);
