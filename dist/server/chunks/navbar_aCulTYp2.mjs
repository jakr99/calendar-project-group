import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import React, { useEffect } from 'react';
/* empty css                         */

const Navbar = () => {
  const [user, setUser] = React.useState(null);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await fetch("/api/get_user", { credentials: "include" });
        const data = await result.json();
        if (result.ok) {
          setUser(data.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user: ", error);
        setUser(null);
      }
    };
    fetchUser();
  }, []);
  const handleSignin = () => {
    window.location.href = "/signin";
  };
  const handleSignout = async () => {
    try {
      const response = await fetch("/api/signout", {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        setUser(null);
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out failed: ", error);
    }
  };
  return /* @__PURE__ */ jsxs("header", { className: "navbar", children: [
    /* @__PURE__ */ jsx("div", { className: "brand", children: "SyncUp" }),
    /* @__PURE__ */ jsxs("nav", { className: "nav-links", children: [
      /* @__PURE__ */ jsx("a", { href: "/", children: "Home" }),
      user && /* @__PURE__ */ jsx("a", { href: "/calendar", children: "Calendar" }),
      /* @__PURE__ */ jsx("a", { href: "/about", children: "About" }),
      /* @__PURE__ */ jsx("a", { href: "/contact", children: "Contact" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "auth-section", children: user ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("span", { className: "user-name", children: [
        "Hello, ",
        user.username
      ] }),
      /* @__PURE__ */ jsx("button", { className: "signout", onClick: handleSignout, children: "Sign out" })
    ] }) : /* @__PURE__ */ jsx("button", { className: "signin", onClick: handleSignin, children: "Sign In" }) })
  ] });
};

export { Navbar as N };
