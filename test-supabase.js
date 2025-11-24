// Test your Supabase connection - run this in browser console
// Go to http://localhost:8083, open console (F12), and paste this:

console.log('=== SUPABASE CONNECTION TEST ===');

// Test 1: Check configuration
const config = {
  url: 'https://iicloyxnyuhsulowbxfs.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpY2xveXhueXVoc3Vsb3dieGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTEzNTYsImV4cCI6MjA3ODUyNzM1Nn0.Rg4AEErRg8QXifAqnccTxj_YsnuwNcUx5uT-wIqWx7Y'
};
console.log('Config:', config);

// Test 2: Raw fetch to categories
fetch(`${config.url}/rest/v1/categories`, {
  headers: {
    'apikey': config.key,
    'Authorization': `Bearer ${config.key}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Raw fetch response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Categories data:', data);
})
.catch(error => {
  console.error('Raw fetch error:', error);
});

// Test 3: Check if tables exist
fetch(`${config.url}/rest/v1/categories?select=count`, {
  headers: {
    'apikey': config.key,
    'Authorization': `Bearer ${config.key}`,
    'Prefer': 'count=exact'
  }
})
.then(response => console.log('Table exists check:', response.status))
.catch(error => console.error('Table check error:', error));