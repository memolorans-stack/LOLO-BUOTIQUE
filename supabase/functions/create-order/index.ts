import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://memolorans-stack.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, {
      status: 405, headers: cors,
    });
  }

  try {
    const body = await req.json();

    const customer_name = String(body.customer_name ?? "").trim();
    const customer_phone = String(body.customer_phone ?? "").trim();
    const governorate = String(body.governorate ?? "").trim();
    const address = String(body.address ?? "").trim();
    const items = body.items;
    const total_price = Number(body.total_price);
    const delivery_fee = Number(body.delivery_fee);

    if (
      !customer_name || customer_name.length > 120 ||
      !/^[0-9+ ()-]{7,32}$/.test(customer_phone) ||
      !governorate || governorate.length > 100 ||
      !address || address.length > 500 ||
      !Array.isArray(items) || items.length < 1 || items.length > 50 ||
      !Number.isFinite(total_price) || total_price < 0 ||
      !Number.isFinite(delivery_fee) || delivery_fee < 0
    ) {
      return Response.json({ error: "بيانات الطلب غير صحيحة" }, {
        status: 400, headers: cors,
      });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !key) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(url, key);

    const { error } = await supabase.from("orders").insert({
      customer_name,
      customer_phone,
      governorate,
      address,
      items: JSON.stringify(items),
      total_price,
      delivery_fee,
      status: "pending",
    });

    if (error) throw error;

    return Response.json({
      success: true,
      message: "تم استلام الطلب بنجاح",
    }, { headers: cors });
  } catch (error) {
    console.error("Order error:", error);
    return Response.json({ error: "تعذر حفظ الطلب" }, {
      status: 500, headers: cors,
    });
  }
});
