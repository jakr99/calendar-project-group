import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_B1t3MPQd.mjs';
import 'piccolore';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { N as Navbar } from '../chunks/navbar_aCulTYp2.mjs';
import PropTypes from 'prop-types';
/* empty css                                    */
export { renderers } from '../renderers.mjs';

const Notification = ({ userId }) => {
  const [notification, setNotification] = useState("");
  const [notificationClass, setNotificationClass] = useState("");
  const [visible, setVisible] = useState(false);
  const clearNotification = () => {
    setVisible(false);
    setNotification("");
    setNotificationClass("");
  };
  const sendNotification = (text, status, duration) => {
    setNotification(text);
    setVisible(true);
    if (status === 0)
      setNotificationClass("successColors");
    else if (status === 1)
      setNotificationClass("neutralColors");
    else if (status === 2)
      setNotificationClass("failColors");
    if (duration !== void 0)
      setTimeout(clearNotification, duration);
  };
  useEffect(() => {
    console.log(`User ID: ${userId}`);
    const ws = new WebSocket(`ws://localhost:3001?userId=${userId}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(JSON.parse(event.data));
      if (data.text) {
        console.log("Notification received: ", data);
        sendNotification(data.text, data.status, data.duration);
      }
    };
    return () => {
      ws.close();
    };
  }, []);
  return /* @__PURE__ */ jsx(
    "div",
    {
      id: "globalNotification",
      className: `${visible ? "notification" : "hidden"} ${notificationClass}`,
      onClick: clearNotification,
      children: notification
    }
  );
};
Notification.propTypes = {
  userId: PropTypes.string
};

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showRemoveEventModal, setShowRemoveEventModal] = useState(false);
  const [user, setUser] = useState(null);
  const [removeEvent, setRemoveEvent] = useState({});
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    type: "3"
    //Default to personal
  });
  console.log(events);
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
    if (!user)
      fetchUser();
  }, []);
  useEffect(() => {
    const fetchEvents = async () => {
      fetch("/api/get_events", { credentials: "include" }).then((res) => res.json()).then((data) => {
        console.log("data: ", data);
        console.log("data.events: ", data.events);
        setEvents(data.events);
        console.log("events: ", events);
      }).catch((error) => console.log("Failed to fetch events:", error));
      console.log("Events:");
    };
    fetchEvents();
  }, []);
  const scheduleNotification = async (text, status, duration, scheduleTime, userId) => {
    const response = await fetch("http://localhost:3001/add-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, status, duration, scheduleTime, userId })
    });
    const data = await response.json();
    console.log("Notification scheduled:", data);
  };
  const handleAddEvent = () => {
    setShowAddEventModal(true);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    const commandId = crypto.randomUUID();
    const fullDateTime = `${newEvent.date}T${newEvent.time}`;
    const payload = {
      commandId,
      payload: {
        title: newEvent.title,
        date: fullDateTime,
        type: newEvent.type,
        time: fullDateTime
      }
    };
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to save event");
      }
      const data = await response.json();
      setEvents([
        ...events,
        {
          title: newEvent.title,
          date: fullDateTime,
          type: newEvent.type,
          id: data.eventId
        }
      ]);
      if (user)
        scheduleNotification(newEvent.title, 0, 6e4, fullDateTime, user.Uid);
      setShowAddEventModal(false);
      setNewEvent({ title: "", date: "", time: "", type: "Personal" });
    } catch (err) {
      alert(`Failed to create event. Please try again. ${err}`);
    }
  };
  const handleRemoveEventHelper = (arg = {}) => {
    setRemoveEvent(arg.event);
  };
  const handleRemoveEvent = async () => {
    const commandId = crypto.randomUUID();
    const payload = {
      commandId,
      payload: { Eid: removeEvent.id }
    };
    console.log(removeEvent.id);
    const response = await fetch("/api/remove_event", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error("Failed to remove event");
    }
    window.location.href = "/calendar";
  };
  return /* @__PURE__ */ jsxs("div", { className: "calendar-container", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    user && /* @__PURE__ */ jsx(Notification, { userId: user.Uid }),
    /* @__PURE__ */ jsxs("main", { className: "calendar-main", children: [
      /* @__PURE__ */ jsxs("div", { className: "calendar-header", children: [
        /* @__PURE__ */ jsx("h2", { children: "My Calendar" }),
        /* @__PURE__ */ jsx("button", { onClick: handleAddEvent, children: "Add Event" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "calendar-grid", children: /* @__PURE__ */ jsx(
        FullCalendar,
        {
          plugins: [dayGridPlugin],
          initialView: "dayGridMonth",
          events,
          eventClick: (arg) => {
            handleRemoveEventHelper(arg);
            setShowRemoveEventModal(true);
          },
          height: "auto"
        }
      ) })
    ] }),
    showAddEventModal && /* @__PURE__ */ jsx("div", { className: "modal-overlay", children: /* @__PURE__ */ jsxs("div", { className: "modal", children: [
      /* @__PURE__ */ jsx("h3", { children: "Add New Event" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "title", children: "Title" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "title",
            type: "text",
            value: newEvent.title,
            onChange: (e) => setNewEvent({ ...newEvent, title: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "date", children: "Date" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "date",
            type: "date",
            value: newEvent.date,
            onChange: (e) => setNewEvent({ ...newEvent, date: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "time", children: "Time" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "time",
            type: "time",
            value: newEvent.time,
            onChange: (e) => setNewEvent({ ...newEvent, time: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "type", children: "Type" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: "type",
            value: newEvent.type,
            onChange: (e) => setNewEvent({ ...newEvent, type: e.target.value }),
            children: [
              /* @__PURE__ */ jsx("option", { value: "1", children: "School" }),
              /* @__PURE__ */ jsx("option", { value: "2", children: "Work" }),
              /* @__PURE__ */ jsx("option", { value: "3", children: "Personal" }),
              /* @__PURE__ */ jsx("option", { value: "4", children: "Family" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "modal-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "submit", children: "Add" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowAddEventModal(false), children: "Cancel" })
        ] })
      ] })
    ] }) }),
    showRemoveEventModal && /* @__PURE__ */ jsx("div", { className: "modal-overlay", children: /* @__PURE__ */ jsxs("div", { className: "modal", children: [
      /* @__PURE__ */ jsx("h2", { children: "Remove Event?" }),
      /* @__PURE__ */ jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsx("button", { onClick: handleRemoveEvent, children: "Remove Event" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
          setShowRemoveEventModal(false);
          handleRemoveEventHelper([]);
        }, children: "Cancel" })
      ] })
    ] }) })
  ] });
};

const $$Calendar = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Navbar", Navbar, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/jakelee/calendar-project-group/src/components/navbar.jsx", "client:component-export": "default" })} ${renderComponent($$result, "CalendarComponent", Calendar, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/jakelee/calendar-project-group/src/components/calendar.jsx", "client:component-export": "default" })}`;
}, "/Users/jakelee/calendar-project-group/src/pages/calendar.astro", void 0);

const $$file = "/Users/jakelee/calendar-project-group/src/pages/calendar.astro";
const $$url = "/calendar";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Calendar,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
