export type ExampleId = "node" | "python" | "env";

export interface ExampleIncident {
  id: ExampleId;
  title: string;
  stakes: string;
  runtime: string;
  log: string;
}

export const EXAMPLES: ExampleIncident[] = [
  {
    id: "node",
    title: "Checkout crash",
    stakes: "Customers cannot finish paying",
    runtime: "Node",
    log: `2026-08-17T14:02:11.441Z ERROR checkout failed
TypeError: Cannot read properties of undefined (reading 'id')
    at getUser (/app/src/services/userService.js:42:22)
    at processCheckout (/app/src/routes/checkout.js:18:19)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)

Request { method: 'POST', path: '/checkout', email: 'guest@shop.test' }
`,
  },
  {
    id: "python",
    title: "Payment total missing",
    stakes: "Charges throw instead of collecting money",
    runtime: "Python",
    log: `INFO:     10.0.0.8:51221 - "POST /pay HTTP/1.1" 500 Internal Server Error
Traceback (most recent call last):
  File "/app/app.py", line 88, in process_payment
    amount = order["total"]
KeyError: 'total'

order payload: {"id": "ord_1842", "currency": "usd", "items": 3}
`,
  },
  {
    id: "env",
    title: "Database never connected",
    stakes: "The whole product looks down after deploy",
    runtime: "Config",
    log: `2026-08-17T09:11:03.102Z starting api on :8080
2026-08-17T09:11:03.228Z FATAL DATABASE_URL is undefined
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
    at createPool (/app/src/db.js:4:18)
    at Object.<anonymous> (/app/src/index.js:12:12)

UnhandledPromiseRejectionWarning: Error: connect ECONNREFUSED 127.0.0.1:5432
`,
  },
];
