import React from "react";

const Dashboard: React.FC = () => {
  const user = localStorage.getItem("user");
  const userObj = user ? JSON.parse(user) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/signin";
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto" }}>
      <h2>Dashboard</h2>
      {userObj && <p>Welcome, {userObj.name}!</p>}
      <button onClick={handleLogout}>Sign Out</button>
    </div>
  );
};

export default Dashboard;
