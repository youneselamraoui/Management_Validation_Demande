import React, { useEffect, useState } from "react";
import axios from "axios";

function ActiveUsersPage() {
  const [activeusers, setactiveusers] = useState([]);
  const [filteredactiveusers, setFilteredactiveusers] = useState([]);
  const [error, setError] = useState(null);   // ✅ define error state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5173/api/activeusers", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data.sort((a, b) => b.id - a.id);
        setactiveusers(data);
        setFilteredactiveusers(data);
      } catch (err) {
        setError("Erreur chargement départements");  // ✅ now works
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveUser();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Active Users</h2>
      <pre>{JSON.stringify(filteredActiveUsers, null, 2)}</pre>
    </div>
  );
}

export default ActiveUsersPage;