import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_B1t3MPQd.mjs';
import 'piccolore';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { N as Navbar } from '../chunks/navbar_aCulTYp2.mjs';
/* empty css                                   */
export { renderers } from '../renderers.mjs';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Message submitted:", formData);
  };
  return /* @__PURE__ */ jsxs("div", { className: "contact-container", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsxs("main", { children: [
      /* @__PURE__ */ jsxs("div", { className: "contact-info", children: [
        /* @__PURE__ */ jsx("h2", { children: "Contact Us" }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Address:" }),
          " 123 main street, Fakeville, USA, 65401"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Phone:" }),
          " (555) 555-5555"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Email:" }),
          " contact@syncupapp.com"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "contact-main", children: [
        /* @__PURE__ */ jsxs("form", { className: "contact-form", onSubmit: handleSubmit, children: [
          /* @__PURE__ */ jsx("h3", { children: "Send Us a Message" }),
          /* @__PURE__ */ jsx("label", { htmlFor: "name", children: "Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              id: "name",
              name: "name",
              value: formData.name,
              onChange: handleChange,
              required: true
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "email", children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              id: "email",
              name: "email",
              value: formData.email,
              onChange: handleChange,
              required: true
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "message", children: "Message" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: "message",
              name: "message",
              rows: "5",
              value: formData.message,
              onChange: handleChange,
              required: true
            }
          ),
          /* @__PURE__ */ jsx("button", { type: "submit", children: "Submit" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "map-embed", children: [
          /* @__PURE__ */ jsx("h3", { children: "Our Location" }),
          /* @__PURE__ */ jsx(
            "iframe",
            {
              title: "SyncUp Location",
              src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3089.771059438733!2d-91.7749446846407!3d37.95470997972937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87dcbf3e1f3c8f3f%3A0x8c7b0f6e6e4e1e3e!2sMissouri%20University%20of%20Science%20and%20Technology!5e0!3m2!1sen!2sus!4v1700260000000",
              width: "100%",
              height: "300",
              style: { border: 0 },
              allowFullScreen: "",
              loading: "lazy",
              referrerPolicy: "no-referrer-when-downgrade"
            }
          )
        ] })
      ] })
    ] })
  ] });
};

const $$Contact = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Navbar", Navbar, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/jakelee/calendar-project-group/src/components/navbar.jsx", "client:component-export": "default" })} ${renderComponent($$result, "ContactComponent", Contact, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/jakelee/calendar-project-group/src/components/contact.jsx", "client:component-export": "default" })}`;
}, "/Users/jakelee/calendar-project-group/src/pages/contact.astro", void 0);

const $$file = "/Users/jakelee/calendar-project-group/src/pages/contact.astro";
const $$url = "/contact";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contact,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
