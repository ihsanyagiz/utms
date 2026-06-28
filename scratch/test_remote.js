async function fetchYgkIntibakEditorHtml() {
  const baseUrl = 'https://utms.4yna.com';
  
  const params = new URLSearchParams();
  params.append('email', 'ygk.ceng@test');
  params.append('password', 'test');
  params.append('role', 'ygk');

  try {
    const loginRes = await fetch(`${baseUrl}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      redirect: 'manual'
    });

    const setCookie = loginRes.headers.get('set-cookie') || '';
    const cookieHeader = setCookie.split(';')[0];
    
    console.log('Fetching YGK /dashboard/tab/intibak-table for app_id=14...');
    const res = await fetch(`${baseUrl}/dashboard/tab/intibak-table?page=1&app_id=14`, {
      headers: { 'Cookie': cookieHeader }
    });
    const html = await res.text();
    console.log('intibak-table HTML Length:', html.length);
    
    console.log('\n--- PORTAL CONTENT SNIPPET ---');
    console.log(html.slice(0, 1500).replace(/\s+/g, ' '));

    // Search for forms, inputs, selects, and table headers
    console.log('\n--- TABLES FOUND ---');
    const tables = html.match(/<table[\s\S]*?<\/table>/g) || [];
    console.log(`Found ${tables.length} tables in this editor panel.`);
    tables.forEach((t, index) => {
      console.log(`\nTable ${index + 1} content:`);
      console.log(t.slice(0, 1000).replace(/\s+/g, ' ') + '...\n');
    });

    console.log('\n--- INPUT AND SELECT FIELDS ---');
    const inputs = html.match(/<(input|select|button)\b[^>]*>/gm) || [];
    inputs.forEach(i => console.log(i));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchYgkIntibakEditorHtml();
