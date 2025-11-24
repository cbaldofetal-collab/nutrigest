// Test script to verify file upload works
const fs = require('fs');
const FormData = require('form-data');

// Create a simple test file
const testContent = 'Name,Age,City\nJohn,25,New York\nJane,30,Los Angeles';
fs.writeFileSync('test-file.csv', testContent);

// Create FormData
const form = new FormData();
form.append('file', fs.createReadStream('test-file.csv'));

// Make the request
fetch('http://localhost:3003/api/sheets/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer test-token',
    ...form.getHeaders()
  },
  body: form
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  fs.unlinkSync('test-file.csv'); // Clean up
})
.catch(error => {
  console.error('Error:', error);
  fs.unlinkSync('test-file.csv'); // Clean up
});