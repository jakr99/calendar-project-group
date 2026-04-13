import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_B1t3MPQd.mjs';
import 'piccolore';
import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
/* empty css                                 */
import { N as Navbar } from '../chunks/navbar_aCulTYp2.mjs';
export { renderers } from '../renderers.mjs';

const About = () => {
  return /* @__PURE__ */ jsxs("div", { className: "about-container", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsxs("main", { children: [
      /* @__PURE__ */ jsxs("header", { className: "about-header", children: [
        /* @__PURE__ */ jsx("h1", { children: "About SyncUp" }),
        /* @__PURE__ */ jsx("p", { children: "Plan together. Find Time. Stay organized." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "about-section", children: [
        /* @__PURE__ */ jsx("h2", { children: "Team Members" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "Drake Hoffman - Team Lead" }),
          /* @__PURE__ */ jsx("li", { children: "William Thomsen - Developer" }),
          /* @__PURE__ */ jsx("li", { children: "Ian Heathcote - Developer" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "about-section", children: [
        /* @__PURE__ */ jsx("h2", { children: "Project Description" }),
        /* @__PURE__ */ jsx("p", { children: "SyncUp addresses the challenge of scheduling conflicts when planning events or meeting. Whether coordinating with friends or colleagues, or app simplifies planning by identifying shared availability." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "about-section", children: [
        /* @__PURE__ */ jsx("h2", { children: "Objectives" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "Store and edit dates of important events or deadlines" }),
          /* @__PURE__ */ jsx("li", { children: "Create and sync group calendars" }),
          /* @__PURE__ */ jsx("li", { children: "Add timeframes for each day" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "about-section", children: [
        /* @__PURE__ */ jsx("h2", { children: "Scope" }),
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "This app includes:" }) }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "Personal calendar editing and saving" }),
          /* @__PURE__ */ jsx("li", { children: "Sharing/syncing with others" }),
          /* @__PURE__ */ jsx("li", { children: "Categories: Work, Class, Personal, etc." }),
          /* @__PURE__ */ jsx("li", { children: 'Option to share full event content or just "busy" status' })
        ] }),
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "This app will never include:" }) }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "GPS/location sharing" }),
          /* @__PURE__ */ jsx("li", { children: "Messaging" }),
          /* @__PURE__ */ jsx("li", { children: "LLMs" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "about-section", children: [
        /* @__PURE__ */ jsx("h2", { children: "Proposed Solution" }),
        /* @__PURE__ */ jsx("p", { children: "SyncUp is a simple calendar logging system that helps users create and manage events. By syncing group calendars, it enables collaboration planning. The web-based app uses a small database to track users and their groups, making it ideal for families, friend group, and small projects. With sqlite3, it also functions well as a personal calendar." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "about-section", children: [
        /* @__PURE__ */ jsx("h2", { children: "Technology Strack" }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "ReactJS" }),
          /* @__PURE__ */ jsx("li", { children: "NodeJS" }),
          /* @__PURE__ */ jsx("li", { children: "Astro framework" }),
          /* @__PURE__ */ jsx("li", { children: "sqlite3" })
        ] })
      ] })
    ] })
  ] });
};

const $$About = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Navbar", Navbar, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/jakelee/calendar-project-group/src/components/navbar.jsx", "client:component-export": "default" })} ${renderComponent($$result, "AboutComponent", About, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/jakelee/calendar-project-group/src/components/about.jsx", "client:component-export": "default" })}`;
}, "/Users/jakelee/calendar-project-group/src/pages/about.astro", void 0);

const $$file = "/Users/jakelee/calendar-project-group/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$About,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
