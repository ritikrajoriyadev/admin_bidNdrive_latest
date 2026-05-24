import React, { useEffect, useState } from "react";

const Greeting = ({ name = "Admin" }) => {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hours = new Date().getHours();

    if (hours < 12) {
      setGreeting("Good Morning 👋");
    } else if (hours < 18) {
      setGreeting("Good Afternoon ☀️");
    } else {
      setGreeting("Good Evening 🌙");
    }
  }, []);

  return (
    <div className="relative z-10">
      <p className="text-indigo-200 text-xs font-semibold tracking-widest uppercase mb-1">
        {greeting}
      </p>
      <h2 className="indigo-500 text-2xl font-bold tracking-tight">
        Welcome back, {name}
      </h2>
      <p className="text-indigo-200/70 text-sm mt-1">
        Here's what's happening with your platform today.
      </p>
    </div>
  );
};

export default Greeting;
