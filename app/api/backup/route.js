import postgres from 'postgres';
import { getAuthUser } from '@/lib/auth';
import { createActivityLog } from '@/lib/db';

function getSql() {
  return process.env.DATABASE_URL
    ? postgres(process.env.DATABASE_URL, { ssl: 'require' })
    : null;
}

const n = (v) => (v === undefined ? null : v);

// ── Export ────────────────────────────────────────────────────────────────────

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin')
    return Response.json({ error: '관리자만 데이터를 내보낼 수 있습니다.' }, { status: 403 });

  const sql = getSql();
  if (!sql) return Response.json({ error: '데이터베이스 연결이 없습니다.' }, { status: 500 });

  const [customers, products, orders, orderItems] = await Promise.all([
    sql`SELECT * FROM customers ORDER BY id`,
    sql`SELECT * FROM products ORDER BY id`,
    sql`SELECT * FROM orders ORDER BY id`,
    sql`SELECT * FROM order_items ORDER BY id`,
  ]);

  await createActivityLog({
    user_id: user.id, user_name: user.name, action: 'data_export',
    detail: `데이터 내보내기 (거래처 ${customers.length}건, 품목 ${products.length}건, 주문 ${orders.length}건)`,
  });

  const payload = {
    meta: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: user.name,
      counts: { customers: customers.length, products: products.length, orders: orders.length, orderItems: orderItems.length },
    },
    data: { customers, products, orders, orderItems },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="ksp-erp-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json"`,
    },
  });
}

// ── Import ────────────────────────────────────────────────────────────────────

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin')
    return Response.json({ error: '관리자만 가져오기를 실행할 수 있습니다.' }, { status: 403 });

  const sql = getSql();
  if (!sql) return Response.json({ error: '데이터베이스 연결이 없습니다.' }, { status: 500 });

  const { meta, data, mode } = await request.json();
  const { customers = [], products = [], orders = [], orderItems = [] } = data || {};

  if (!customers.length && !products.length && !orders.length)
    return Response.json({ error: '복원할 데이터가 없습니다.' }, { status: 400 });

  try {
    if (mode === 'replace') {
      // FK 순서대로 삭제 후 원본 ID 유지해서 재삽입
      await sql`DELETE FROM order_items`;
      await sql`DELETE FROM orders`;
      await sql`DELETE FROM products`;
      await sql`DELETE FROM customers`;

      for (const c of customers) {
        await sql`
          INSERT INTO customers (id, business_number, company_name, representative, address,
            business_type, business_category, phone, email, memo, created_at, updated_at)
          OVERRIDING SYSTEM VALUE
          VALUES (${c.id}, ${n(c.business_number)}, ${n(c.company_name)}, ${n(c.representative)}, ${n(c.address)},
            ${n(c.business_type)}, ${n(c.business_category)}, ${n(c.phone)}, ${n(c.email)}, ${n(c.memo)},
            ${n(c.created_at)}, ${n(c.updated_at)})
        `;
      }
      if (customers.length) await sql`SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers))`;

      for (const p of products) {
        await sql`
          INSERT INTO products (id, name, category, unit_price, description, created_at, updated_at)
          OVERRIDING SYSTEM VALUE
          VALUES (${p.id}, ${n(p.name)}, ${n(p.category)}, ${n(p.unit_price)}, ${n(p.description)},
            ${n(p.created_at)}, ${n(p.updated_at)})
        `;
      }
      if (products.length) await sql`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`;

      for (const o of orders) {
        await sql`
          INSERT INTO orders (id, order_number, customer_id, order_date, delivery_date,
            status, total_amount, tax_amount, memo, created_at, updated_at)
          OVERRIDING SYSTEM VALUE
          VALUES (${o.id}, ${n(o.order_number)}, ${n(o.customer_id)}, ${n(o.order_date)}, ${n(o.delivery_date)},
            ${n(o.status)}, ${n(o.total_amount)}, ${n(o.tax_amount)}, ${n(o.memo)},
            ${n(o.created_at)}, ${n(o.updated_at)})
        `;
      }
      if (orders.length) await sql`SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders))`;

      for (const i of orderItems) {
        await sql`
          INSERT INTO order_items (id, order_id, product_id, product_name, width, height,
            color, quantity, unit_price, amount, memo)
          OVERRIDING SYSTEM VALUE
          VALUES (${i.id}, ${n(i.order_id)}, ${n(i.product_id)}, ${n(i.product_name)}, ${n(i.width)}, ${n(i.height)},
            ${n(i.color)}, ${n(i.quantity)}, ${n(i.unit_price)}, ${n(i.amount)}, ${n(i.memo)})
        `;
      }
      if (orderItems.length) await sql`SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items))`;

    } else {
      // merge (최신 우선): updated_at 비교해서 백업이 더 최신이면 덮어쓰기
      const isNewer = (backupTs, dbTs) => {
        if (!backupTs) return false;
        if (!dbTs) return true;
        return new Date(backupTs) > new Date(dbTs);
      };

      const customerIdMap = {};
      for (const c of customers) {
        // 빈 문자열도 null로 정규화 (빈 문자열은 유니크 제약 충돌 유발)
        const bizNum = c.business_number?.trim() || null;

        if (bizNum) {
          // 사업자번호 있음 → ON CONFLICT upsert (최신 우선)
          const rows = await sql`
            INSERT INTO customers (business_number, company_name, representative, address,
              business_type, business_category, phone, email, memo, updated_at)
            VALUES (${bizNum}, ${n(c.company_name)}, ${n(c.representative)}, ${n(c.address)},
              ${n(c.business_type)}, ${n(c.business_category)}, ${n(c.phone)}, ${n(c.email)}, ${n(c.memo)},
              ${n(c.updated_at)})
            ON CONFLICT (business_number) DO UPDATE SET
              company_name = EXCLUDED.company_name,
              representative = EXCLUDED.representative,
              address = EXCLUDED.address,
              business_type = EXCLUDED.business_type,
              business_category = EXCLUDED.business_category,
              phone = EXCLUDED.phone,
              email = EXCLUDED.email,
              memo = EXCLUDED.memo,
              updated_at = EXCLUDED.updated_at
            WHERE customers.updated_at IS NULL OR EXCLUDED.updated_at IS NULL
               OR EXCLUDED.updated_at >= customers.updated_at
            RETURNING id
          `;
          if (rows.length > 0) {
            customerIdMap[c.id] = rows[0].id;
          } else {
            // 기존 데이터가 더 최신 → id만 조회
            const [existing] = await sql`SELECT id FROM customers WHERE business_number = ${bizNum}`;
            customerIdMap[c.id] = existing.id;
          }
        } else {
          // 사업자번호 없음 → 상호명으로 매칭 시도
          const existing = n(c.company_name)
            ? await sql`SELECT id, updated_at FROM customers WHERE company_name = ${c.company_name} AND business_number IS NULL`
            : [];
          if (existing.length > 0) {
            customerIdMap[c.id] = existing[0].id;
            if (isNewer(c.updated_at, existing[0].updated_at)) {
              await sql`
                UPDATE customers SET
                  representative = ${n(c.representative)}, address = ${n(c.address)},
                  business_type = ${n(c.business_type)}, business_category = ${n(c.business_category)},
                  phone = ${n(c.phone)}, email = ${n(c.email)}, memo = ${n(c.memo)},
                  updated_at = ${n(c.updated_at)}
                WHERE id = ${existing[0].id}
              `;
            }
          } else {
            const [{ id }] = await sql`
              INSERT INTO customers (business_number, company_name, representative, address,
                business_type, business_category, phone, email, memo)
              VALUES (null, ${n(c.company_name)}, ${n(c.representative)}, ${n(c.address)},
                ${n(c.business_type)}, ${n(c.business_category)}, ${n(c.phone)}, ${n(c.email)}, ${n(c.memo)})
              RETURNING id
            `;
            customerIdMap[c.id] = id;
          }
        }
      }

      const productIdMap = {};
      for (const p of products) {
        const existing = await sql`SELECT id, updated_at FROM products WHERE name = ${p.name} AND category = ${n(p.category)}`;
        if (existing.length > 0) {
          productIdMap[p.id] = existing[0].id;
          if (isNewer(p.updated_at, existing[0].updated_at)) {
            await sql`
              UPDATE products SET
                unit_price = ${n(p.unit_price)}, description = ${n(p.description)},
                updated_at = ${n(p.updated_at)}
              WHERE id = ${existing[0].id}
            `;
          }
        } else {
          const [{ id }] = await sql`
            INSERT INTO products (name, category, unit_price, description)
            VALUES (${n(p.name)}, ${n(p.category)}, ${n(p.unit_price)}, ${n(p.description)})
            RETURNING id
          `;
          productIdMap[p.id] = id;
        }
      }

      const orderIdMap = {};
      for (const o of orders) {
        const existing = await sql`SELECT id, updated_at FROM orders WHERE order_number = ${o.order_number}`;
        const newCustomerId = customerIdMap[o.customer_id] ?? o.customer_id;
        const items = orderItems.filter((i) => i.order_id === o.id);

        if (existing.length > 0) {
          orderIdMap[o.id] = existing[0].id;
          if (isNewer(o.updated_at, existing[0].updated_at)) {
            await sql`
              UPDATE orders SET
                customer_id = ${n(newCustomerId)}, order_date = ${n(o.order_date)},
                delivery_date = ${n(o.delivery_date)}, status = ${n(o.status)},
                total_amount = ${n(o.total_amount)}, tax_amount = ${n(o.tax_amount)},
                memo = ${n(o.memo)}, updated_at = ${n(o.updated_at)}
              WHERE id = ${existing[0].id}
            `;
            // 주문 항목도 교체
            await sql`DELETE FROM order_items WHERE order_id = ${existing[0].id}`;
            for (const i of items) {
              const newProductId = productIdMap[i.product_id] ?? i.product_id;
              await sql`
                INSERT INTO order_items (order_id, product_id, product_name, width, height,
                  color, quantity, unit_price, amount, memo)
                VALUES (${existing[0].id}, ${n(newProductId)}, ${n(i.product_name)}, ${n(i.width)}, ${n(i.height)},
                  ${n(i.color)}, ${n(i.quantity)}, ${n(i.unit_price)}, ${n(i.amount)}, ${n(i.memo)})
              `;
            }
          }
        } else {
          const [{ id }] = await sql`
            INSERT INTO orders (order_number, customer_id, order_date, delivery_date,
              status, total_amount, tax_amount, memo)
            VALUES (${n(o.order_number)}, ${n(newCustomerId)}, ${n(o.order_date)}, ${n(o.delivery_date)},
              ${n(o.status)}, ${n(o.total_amount)}, ${n(o.tax_amount)}, ${n(o.memo)})
            RETURNING id
          `;
          orderIdMap[o.id] = id;
          for (const i of items) {
            const newProductId = productIdMap[i.product_id] ?? i.product_id;
            await sql`
              INSERT INTO order_items (order_id, product_id, product_name, width, height,
                color, quantity, unit_price, amount, memo)
              VALUES (${id}, ${n(newProductId)}, ${n(i.product_name)}, ${n(i.width)}, ${n(i.height)},
                ${n(i.color)}, ${n(i.quantity)}, ${n(i.unit_price)}, ${n(i.amount)}, ${n(i.memo)})
            `;
          }
        }
      }
    }

    await createActivityLog({
      user_id: user.id, user_name: user.name, action: 'data_import',
      detail: `데이터 가져오기 (${mode === 'replace' ? '전체 교체' : '최신 우선 병합'}) - 백업일시: ${meta?.exported_at?.slice(0, 19).replace('T', ' ') || '알 수 없음'}`,
    });

    return Response.json({ ok: true, mode });
  } catch (err) {
    console.error('Import error:', err);
    const msg = err.code === '23505'
      ? '중복 데이터가 있어 가져오기에 실패했습니다. 전체 교체 모드를 사용해보세요.'
      : '데이터 가져오기 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    return Response.json({ error: msg }, { status: 500 });
  }
}
