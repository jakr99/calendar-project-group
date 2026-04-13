export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  return new Response(
    JSON.stringify({ status: "signed_out" }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Set-Cookie": "session=; HttpOnly; Path=/; Max-Age=0"
      }
    }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
