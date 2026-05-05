
const http = require('http');
const PORT = 3001;

const properties = [
  {id:1,name:'Flat 2B-101',type:'flat',bhk:2,status:'available',purpose:'rent',rentPrice:12000,salePriceINR:null,floor:1,sizeSqft:850,locality:'Block B',photos:[],description:'Spacious 2BHK flat'},
  {id:2,name:'Shop GF-05',type:'shop',bhk:null,status:'occupied',purpose:'rent',rentPrice:18000,salePriceINR:null,floor:0,sizeSqft:320,locality:'Ground Floor',photos:[],description:'Corner shop'},
  {id:3,name:'Flat 3A-202',type:'flat',bhk:3,status:'available',purpose:'both',rentPrice:16000,salePriceINR:2800000,floor:2,sizeSqft:1100,locality:'Block A',photos:[],description:'3BHK with parking'},
  {id:4,name:'Grocery Store GF-12',type:'grocery_store',bhk:null,status:'occupied',purpose:'rent',rentPrice:14000,salePriceINR:null,floor:0,sizeSqft:450,locality:'Market Area',photos:[],description:'Prime location grocery'},
  {id:5,name:'Flat 1C-305',type:'flat',bhk:2,status:'available',purpose:'rent',rentPrice:10000,salePriceINR:null,floor:3,sizeSqft:750,locality:'Block C',photos:[],description:'2BHK affordable flat'},
  {id:6,name:'Market Stall M-08',type:'market',bhk:null,status:'for_sale',purpose:'sale',rentPrice:null,salePriceINR:1500000,floor:0,sizeSqft:200,locality:'Market Area',photos:[],description:'Market stall for sale'},
  {id:7,name:'Flat 2A-401',type:'flat',bhk:3,status:'occupied',purpose:'rent',rentPrice:17000,salePriceINR:null,floor:4,sizeSqft:1050,locality:'Block A',photos:[],description:'Premium 3BHK'},
  {id:8,name:'Shop FF-03',type:'shop',bhk:null,status:'available',purpose:'rent',rentPrice:11000,salePriceINR:null,floor:1,sizeSqft:280,locality:'First Floor',photos:[],description:'First floor shop'},
  {id:9,name:'Flat 4B-102',type:'flat',bhk:2,status:'available',purpose:'sale',rentPrice:null,salePriceINR:2200000,floor:1,sizeSqft:900,locality:'Block B',photos:[],description:'2BHK for sale'},
  {id:10,name:'Office OF-201',type:'shop',bhk:null,status:'occupied',purpose:'rent',rentPrice:22000,salePriceINR:null,floor:2,sizeSqft:600,locality:'Office Wing',photos:[],description:'Commercial office space'}
];

const tenants = [
  {id:1,name:'Suresh Prasad',email:'suresh@example.com',phone:'9876543210',aadhaarNumber:'1234-5678-9012',emergencyContact:'9876509876',propertyId:2,status:'active',joinedAt:'2024-01-15'},
  {id:2,name:'Meena Devi',email:'meena@example.com',phone:'9876543211',aadhaarNumber:'2345-6789-0123',emergencyContact:'9876508765',propertyId:4,status:'active',joinedAt:'2024-03-01'},
  {id:3,name:'Priya Singh',email:'priya@example.com',phone:'9876543212',aadhaarNumber:'3456-7890-1234',emergencyContact:'9876507654',propertyId:7,status:'active',joinedAt:'2024-02-10'},
  {id:4,name:'Rahul Gupta',email:'rahul@example.com',phone:'9876543213',aadhaarNumber:'4567-8901-2345',emergencyContact:'9876506543',propertyId:12,status:'inactive',joinedAt:'2023-11-05'}
];

const users = [
  {id:1,name:'Admin User',email:'admin@patna.com',passwordHash:'admin123',role:'admin'},
  ...tenants.map(t=>({id:t.id+10,name:t.name,email:t.email,passwordHash:'tenant123',role:'tenant'}))
];

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}

function json(res, data, status=200) {
  cors(res);
  res.writeHead(status, {'Content-Type':'application/json'});
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

function getUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const decoded = Buffer.from(auth.slice(7), 'base64').toString();
    const [id, email, role] = decoded.split(':');
    return users.find(u => u.id == id && u.email == email && u.role == role) || null;
  } catch { return null; }
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

  if (method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  // Health
  if (url === '/api/health') return json(res, {status:'ok'});

  // Auth
  if (url === '/api/auth/login' && method === 'POST') {
    const {email, password} = await parseBody(req);
    const u = users.find(u => u.email === email && u.passwordHash === password);
    if (!u) return json(res, {error:'Invalid credentials'}, 401);
    const token = Buffer.from(`${u.id}:${u.email}:${u.role}`).toString('base64');
    return json(res, {user:{id:u.id,name:u.name,email:u.email,role:u.role}, token});
  }
  if (url === '/api/auth/register' && method === 'POST') {
    const body = await parseBody(req);
    const newUser = {id:users.length+1, name:body.name, email:body.email, passwordHash:body.password, role:body.role||'tenant'};
    users.push(newUser);
    const token = Buffer.from(`${newUser.id}:${newUser.email}:${newUser.role}`).toString('base64');
    return json(res, {user:{id:newUser.id,name:newUser.name,email:newUser.email,role:newUser.role}, token}, 201);
  }
  if (url === '/api/auth/me') {
    const u = getUser(req);
    if (!u) return json(res, {error:'Unauthorized'}, 401);
    return json(res, {id:u.id,name:u.name,email:u.email,role:u.role});
  }
  if (url === '/api/auth/logout' && method === 'POST') return json(res, {success:true});

  // Properties
  if (url === '/api/properties' && method === 'GET') return json(res, properties);
  if (url.match(/^\/api\/properties\/\d+$/) && method === 'GET') {
    const id = parseInt(url.split('/')[3]);
    const p = properties.find(p => p.id === id);
    return p ? json(res, p) : json(res, {error:'Not found'}, 404);
  }
  if (url === '/api/properties' && method === 'POST') {
    const body = await parseBody(req);
    const p = {id: properties.length+1, ...body};
    properties.push(p);
    return json(res, p, 201);
  }
  if (url.match(/^\/api\/properties\/\d+$/) && method === 'PUT') {
    const id = parseInt(url.split('/')[3]);
    const idx = properties.findIndex(p => p.id === id);
    if (idx === -1) return json(res, {error:'Not found'}, 404);
    const body = await parseBody(req);
    properties[idx] = {...properties[idx], ...body};
    return json(res, properties[idx]);
  }
  if (url.match(/^\/api\/properties\/\d+$/) && method === 'DELETE') {
    const id = parseInt(url.split('/')[3]);
    const idx = properties.findIndex(p => p.id === id);
    if (idx === -1) return json(res, {error:'Not found'}, 404);
    properties.splice(idx, 1);
    return json(res, {success:true});
  }

  // Tenants
  if (url === '/api/tenants' && method === 'GET') return json(res, tenants);
  if (url.match(/^\/api\/tenants\/\d+$/) && method === 'GET') {
    const id = parseInt(url.split('/')[3]);
    const t = tenants.find(t => t.id === id);
    return t ? json(res, t) : json(res, {error:'Not found'}, 404);
  }
  if (url === '/api/tenants' && method === 'POST') {
    const body = await parseBody(req);
    const t = {id: tenants.length+1, ...body};
    tenants.push(t);
    return json(res, t, 201);
  }

  // Leases
  const leases = [
    {id:1,tenantId:1,propertyId:2,startDate:'2024-01-15',endDate:'2025-01-14',monthlyRent:18000,securityDeposit:36000,status:'active'},
    {id:2,tenantId:2,propertyId:4,startDate:'2024-03-01',endDate:'2025-02-28',monthlyRent:14000,securityDeposit:28000,status:'active'},
    {id:3,tenantId:3,propertyId:7,startDate:'2023-11-10',endDate:'2024-11-09',monthlyRent:17000,securityDeposit:34000,status:'active'},
    {id:4,tenantId:4,propertyId:10,startDate:'2024-02-20',endDate:'2025-02-19',monthlyRent:22000,securityDeposit:44000,status:'active'}
  ];
  if (url === '/api/leases' && method === 'GET') return json(res, leases);
  if (url === '/api/leases' && method === 'POST') {
    const body = await parseBody(req);
    const l = {id: leases.length+1, ...body};
    leases.push(l);
    return json(res, l, 201);
  }

  // Payments
  const payments = [
    {id:1,tenantId:1,propertyId:2,amount:18000,date:'2026-04-01',method:'UPI',month:'April',year:2026,status:'paid'},
    {id:2,tenantId:2,propertyId:4,amount:14000,date:'2026-04-02',method:'Cash',month:'April',year:2026,status:'paid'},
    {id:3,tenantId:3,propertyId:7,amount:17000,date:'2026-04-05',method:'Bank Transfer',month:'April',year:2026,status:'paid'},
    {id:4,tenantId:4,propertyId:10,amount:22000,date:'2026-04-03',method:'UPI',month:'April',year:2026,status:'paid'},
    {id:5,tenantId:1,propertyId:2,amount:18000,date:'2026-05-01',method:'UPI',month:'May',year:2026,status:'pending'}
  ];
  if (url === '/api/payments' && method === 'GET') return json(res, payments);
  if (url === '/api/payments' && method === 'POST') {
    const body = await parseBody(req);
    const p = {id: payments.length+1, ...body};
    payments.push(p);
    return json(res, p, 201);
  }

  // Maintenance
  const maintenance = [
    {id:1,propertyId:2,tenantId:1,title:'Leaking tap',description:'Kitchen tap leaking',status:'pending',priority:'medium',createdAt:'2026-05-01'},
    {id:2,propertyId:7,tenantId:3,title:'AC not working',description:'Split AC not cooling',status:'in_progress',priority:'high',createdAt:'2026-04-28'},
    {id:3,propertyId:4,tenantId:2,title:'Paint peeling',description:'Ceiling paint peeling',status:'resolved',priority:'low',createdAt:'2026-04-20'}
  ];
  if (url === '/api/maintenance' && method === 'GET') return json(res, maintenance);
  if (url === '/api/maintenance' && method === 'POST') {
    const body = await parseBody(req);
    const m = {id: maintenance.length+1, ...body, createdAt: new Date().toISOString().split('T')[0]};
    maintenance.push(m);
    return json(res, m, 201);
  }
  if (url.match(/^\/api\/maintenance\/\d+$/) && (method==='PUT'||method==='PATCH')) {
    const id = parseInt(url.split('/')[3]);
    const idx = maintenance.findIndex(m => m.id === id);
    if (idx === -1) return json(res, {error:'Not found'}, 404);
    const body = await parseBody(req);
    maintenance[idx] = {...maintenance[idx], ...body};
    return json(res, maintenance[idx]);
  }

  // Inquiries
  const inquiries = [
    {id:1,name:'Rohit Verma',email:'rohit@example.com',phone:'9811234567',propertyId:3,message:'Interested in 3BHK flat',status:'new',createdAt:'2026-05-03'},
    {id:2,name:'Neha Gupta',email:'neha@example.com',phone:'9822345678',propertyId:1,message:'When is it available?',status:'contacted',createdAt:'2026-05-02'}
  ];
  if (url === '/api/inquiries' && method === 'GET') return json(res, inquiries);
  if (url === '/api/inquiries' && method === 'POST') {
    const body = await parseBody(req);
    const i = {id: inquiries.length+1, ...body, status:'new', createdAt: new Date().toISOString().split('T')[0]};
    inquiries.push(i);
    return json(res, i, 201);
  }

  // Dashboard stats
  if (url === '/api/dashboard') {
    return json(res, {
      totalProperties: properties.length,
      occupiedProperties: properties.filter(p=>p.status==='occupied').length,
      availableProperties: properties.filter(p=>p.status==='available').length,
      totalTenants: tenants.length,
      rentCollectedThisMonth: payments.filter(p=>p.month==='April'&&p.year===2026&&p.status==='paid').reduce((a,p)=>a+p.amount,0),
      pendingMaintenance: maintenance.filter(m=>m.status==='pending').length,
      overduePayments: payments.filter(p=>p.status==='pending').length
    });
  }

  // Rent roll
  if (url === '/api/rent-roll') {
    return json(res, leases.map(l => ({
      ...l,
      tenant: tenants.find(t=>t.id===l.tenantId),
      property: properties.find(p=>p.id===l.propertyId)
    })));
  }

  // Collection report
  if (url === '/api/collection-report') {
    return json(res, {month:'May 2026', totalDue: 71000, totalCollected: 71000, pending: 18000, payments});
  }

  // Storage (image upload - mock)
  if (url.startsWith('/api/storage')) return json(res, {url:'https://placehold.co/400x300/e2e8f0/94a3b8?text=Property'});

  json(res, {error:'Not found'}, 404);
});

server.listen(PORT, () => console.log(`Mock API server running on port ${PORT}`));
