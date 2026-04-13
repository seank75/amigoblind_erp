import postgres from 'postgres';

const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { ssl: 'require' })
  : null;

const n = (v) => (v === undefined ? null : v);

export async function initializeDb() {
  if (!sql) return;
  try {
    await sql`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, key VARCHAR(50) UNIQUE NOT NULL, value TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY, business_number VARCHAR(20) UNIQUE, company_name VARCHAR(100) NOT NULL, representative VARCHAR(50), address TEXT, business_type VARCHAR(50), business_category VARCHAR(50), phone VARCHAR(20), email VARCHAR(100), memo TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, category VARCHAR(50), unit_price INTEGER DEFAULT 0, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, order_number VARCHAR(20) UNIQUE NOT NULL, customer_id INTEGER NOT NULL REFERENCES customers(id), order_date DATE, delivery_date DATE, status VARCHAR(20) DEFAULT '접수', total_amount INTEGER DEFAULT 0, tax_amount INTEGER DEFAULT 0, memo TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    await sql`CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER REFERENCES products(id), product_name VARCHAR(100) NOT NULL, width INTEGER, height INTEGER, color VARCHAR(50), quantity INTEGER DEFAULT 1, unit_price INTEGER DEFAULT 0, amount INTEGER DEFAULT 0, memo TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS tax_invoices (id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), mgt_key VARCHAR(50) UNIQUE, issue_date DATE, amount INTEGER, tax INTEGER, status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    const [{ count }] = await sql`SELECT count(*) FROM products`;
    if (parseInt(count) === 0) {
      const initialProducts = [
        ['롤블라인드 기본', '롤블라인드', 35000, '기본형 롤블라인드'],
        ['롤블라인드 암막', '롤블라인드', 45000, '암막 기능 롤블라인드'],
        ['버티칼 블라인드', '버티칼', 50000, '수직형 버티칼 블라인드'],
        ['우드 블라인드', '우드', 70000, '원목 우드 블라인드'],
        ['허니콤 블라인드', '허니콤', 60000, '단열 허니콤 블라인드'],
        ['콤비 블라인드', '콤비', 40000, '콤비네이션 블라인드'],
        ['베네시안 블라인드', '베네시안', 55000, '수평형 베네시안 블라인드']
      ];
      for (const p of initialProducts) {
        await sql`INSERT INTO products (name, category, unit_price, description) VALUES (${p[0]}, ${p[1]}, ${p[2]}, ${p[3]})`;
      }
    }
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
  }
}

export async function getSettings() {
  if (!sql) return {};
  const rows = await sql`SELECT key, value FROM settings`;
  const settings = {};
  rows.forEach((row) => { settings[row.key] = row.value; });
  return settings;
}

export async function updateSettings(settingsObj) {
  if (!sql) return;
  for (const [key, value] of Object.entries(settingsObj)) {
    await sql`INSERT INTO settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }
}

export async function getAllCustomers() {
  if (!sql) return [];
  return await sql`SELECT * FROM customers ORDER BY created_at DESC`;
}

export async function getCustomerById(id) {
  if (!sql) return null;
  const rows = await sql`SELECT * FROM customers WHERE id = ${n(id)}`;
  return rows[0] || null;
}

export async function createCustomer(data) {
  if (!sql) return { id: 0 };
  const rows = await sql`
    INSERT INTO customers (
      business_number, company_name, representative, address,
      business_type, business_category, phone, email, memo
    ) VALUES (
      ${n(data.business_number)}, ${n(data.company_name)}, ${n(data.representative)}, ${n(data.address)},
      ${n(data.business_type)}, ${n(data.business_category)}, ${n(data.phone)}, ${n(data.email)}, ${n(data.memo)}
    )
    RETURNING id
  `;
  return { lastInsertRowid: rows[0].id };
}

export async function updateCustomer(id, data) {
  if (!sql) return;
  await sql`
    UPDATE customers SET
      business_number = ${n(data.business_number)},
      company_name = ${n(data.company_name)},
      representative = ${n(data.representative)},
      address = ${n(data.address)},
      business_type = ${n(data.business_type)},
      business_category = ${n(data.business_category)},
      phone = ${n(data.phone)},
      email = ${n(data.email)},
      memo = ${n(data.memo)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${n(id)}
  `;
}

export async function deleteCustomer(id) {
  if (!sql) return;
  await sql`DELETE FROM customers WHERE id = ${n(id)}`;
}

export async function getAllProducts() {
  if (!sql) return [];
  return await sql`SELECT * FROM products ORDER BY category, name`;
}

export async function getProductById(id) {
  if (!sql) return null;
  const rows = await sql`SELECT * FROM products WHERE id = ${n(id)}`;
  return rows[0] || null;
}

export async function createProduct(data) {
  if (!sql) return { id: 0 };
  const rows = await sql`
    INSERT INTO products (name, category, unit_price, description)
    VALUES (${n(data.name)}, ${n(data.category)}, ${n(data.unit_price)}, ${n(data.description)})
    RETURNING id
  `;
  return { lastInsertRowid: rows[0].id };
}

export async function updateProduct(id, data) {
  if (!sql) return;
  await sql`
    UPDATE products SET
      name = ${n(data.name)},
      category = ${n(data.category)},
      unit_price = ${n(data.unit_price)},
      description = ${n(data.description)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${n(id)}
  `;
}

export async function deleteProduct(id) {
  if (!sql) return;
  await sql`DELETE FROM products WHERE id = ${n(id)}`;
}

function generateOrderNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${yyyy}${mm}${dd}-${rand}`;
}

export async function getAllOrders() {
  if (!sql) return [];
  return await sql`
    SELECT o.*, c.company_name as customer_name, c.business_number as customer_business_number
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
  `;
}

export async function getOrderById(id) {
  if (!sql) return null;
  const orders = await sql`
    SELECT o.*, 
           c.company_name as customer_name, 
           c.business_number as customer_business_number,
           c.representative as customer_representative,
           c.address as customer_address,
           c.phone as customer_phone
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ${n(id)}
  `;
  const order = orders[0];
  if (!order) return null;

  const items = await sql`SELECT * FROM order_items WHERE order_id = ${n(id)}`;
  order.items = items;
  return order;
}

export async function createOrder(data) {
  if (!sql) return { id: 0 };
  const orderNumber = generateOrderNumber();
  
  const result = await sql`
    INSERT INTO orders (
      order_number, customer_id, order_date, delivery_date, 
      status, total_amount, tax_amount, memo
    ) VALUES (
      ${n(orderNumber)}, ${n(data.customer_id)}, ${n(data.order_date)}, ${n(data.delivery_date)},
      ${n(data.status || '접수')}, ${n(data.total_amount)}, ${n(data.tax_amount)}, ${n(data.memo)}
    )
    RETURNING id
  `;
  const orderId = result[0].id;

  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      await sql`
        INSERT INTO order_items (
          order_id, product_id, product_name, width, height,
          color, quantity, unit_price, amount, memo
        ) VALUES (
          ${n(orderId)}, ${n(item.product_id)}, ${n(item.product_name)}, ${n(item.width)}, ${n(item.height)},
          ${n(item.color)}, ${n(item.quantity)}, ${n(item.unit_price)}, ${n(item.amount)}, ${n(item.memo)}
        )
      `;
    }
  }

  return { id: orderId, order_number: orderNumber };
}

export async function updateOrderStatus(id, status) {
  if (!sql) return;
  await sql`UPDATE orders SET status = ${n(status)}, updated_at = CURRENT_TIMESTAMP WHERE id = ${n(id)}`;
}

export async function updateOrder(id, data) {
  if (!sql) return;
  await sql`
    UPDATE orders SET
      customer_id = ${n(data.customer_id)},
      order_date = ${n(data.order_date)},
      delivery_date = ${n(data.delivery_date)},
      status = ${n(data.status || '접수')},
      total_amount = ${n(data.total_amount)},
      tax_amount = ${n(data.tax_amount)},
      memo = ${n(data.memo)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${n(id)}
  `;

  if (data.items) {
    await sql`DELETE FROM order_items WHERE order_id = ${n(id)}`;
    for (const item of data.items) {
      await sql`
        INSERT INTO order_items (
          order_id, product_id, product_name, width, height,
          color, quantity, unit_price, amount, memo
        ) VALUES (
          ${n(id)}, ${n(item.product_id)}, ${n(item.product_name)}, ${n(item.width)}, ${n(item.height)},
          ${n(item.color)}, ${n(item.quantity)}, ${n(item.unit_price)}, ${n(item.amount)}, ${n(item.memo)}
        )
      `;
    }
  }
}

export async function deleteOrder(id) {
  if (!sql) return;
  await sql`DELETE FROM orders WHERE id = ${n(id)}`;
}

export async function getDashboardStats() {
  if (!sql) return {};
  
  const currentMonthDate = new Date();
  const year = currentMonthDate.getFullYear();
  const month = String(currentMonthDate.getMonth() + 1).padStart(2, '0');
  const monthPattern = `${year}-${month}%`;

  const [{ count: totalOrders }] = await sql`SELECT count(*) FROM orders WHERE status != '취소'`;
  const [{ count: activeOrders }] = await sql`SELECT count(*) FROM orders WHERE status NOT IN ('완료', '취소')`;
  
  const statusCounts = await sql`
    SELECT status, count(*) as cnt 
    FROM orders 
    WHERE status NOT IN ('완료', '취소') 
    GROUP BY status
  `;

  const [{ count: totalCustomers }] = await sql`SELECT count(*) FROM customers`;

  const [{ total: monthlyRevenue }] = await sql`
    SELECT SUM(total_amount) as total 
    FROM orders 
    WHERE status != '취소' AND CAST(order_date AS TEXT) LIKE ${n(monthPattern)}
  `;

  const recentOrders = await sql`
    SELECT o.id, o.order_number, o.status, o.order_date, o.total_amount, c.company_name as customer_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `;

  return {
    totalOrders: parseInt(totalOrders),
    activeOrders: parseInt(activeOrders),
    statusCounts: statusCounts.map(row => ({ status: row.status, cnt: parseInt(row.cnt) })),
    totalCustomers: parseInt(totalCustomers),
    monthlyRevenue: parseInt(monthlyRevenue || 0),
    recentOrders
  };
}
