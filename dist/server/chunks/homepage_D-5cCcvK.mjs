import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { N as Navbar } from './navbar_aCulTYp2.mjs';
/* empty css                            */

const Homepage = () => {
  return /* @__PURE__ */ jsxs("div", { className: "homepage-container", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsxs("main", { children: [
      /* @__PURE__ */ jsxs("header", { className: "homepage-header", children: [
        /* @__PURE__ */ jsx("h1", { children: "Welcome to SyncUp" }),
        /* @__PURE__ */ jsx("p", { children: "Plan together. Find time. Stay organized." }),
        /* @__PURE__ */ jsx("button", { className: "getStarted", onClick: () => globalThis.location.href = "/register", children: "Get Started" })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "homepage-content", children: [
        /* @__PURE__ */ jsx("h2", { children: "Introduction" }),
        /* @__PURE__ */ jsx("p", { children: "SyncUp helps groups overcome scheduling conflicts and issues by identifying shared availability. Whether you're planning your next project meeting or looking to gather the family for an event, SyncUp has the customizable solution for you!" })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "homepage-content", children: [
        /* @__PURE__ */ jsx("h2", { children: "Features" }),
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "Including:" }) }),
        /* @__PURE__ */ jsxs("ul", { className: "services", children: [
          /* @__PURE__ */ jsx("li", { className: "service-item", children: "Personal calendar editing & saving" }),
          /* @__PURE__ */ jsx("li", { className: "service-item", children: "Sharing/syncing with others" }),
          /* @__PURE__ */ jsx("li", { className: "service-item", children: "Grouping for managers or large families" }),
          /* @__PURE__ */ jsx("li", { className: "service-item", children: "Share full event details and notes" }),
          /* @__PURE__ */ jsx("li", { className: "service-item", children: "Get notifications about RSVPs and event times" })
        ] }),
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "Not including" }) }),
        /* @__PURE__ */ jsxs("ul", { className: "services", children: [
          /* @__PURE__ */ jsx("li", { className: "service-item", children: "We won't share your location or personal data" }),
          /* @__PURE__ */ jsx("li", { className: "service-item", children: "Going to your events for you (We know. We dont want to see your mother in law either)." })
        ] })
      ] })
    ] })
  ] });
};

export { Homepage as H };
