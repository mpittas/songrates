"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function TestSupabase() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [projectUrl, setProjectUrl] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        setProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "Not Set");

        // Try to fetch something generic (auth settings or similar)
        // Even if we aren't logged in, this shouldn't crash if initialized correctly
        const { error } = await supabase
          .from("_non_existent_table_just_to_test")
          .select("*")
          .limit(1);

        // If the error is 'PGRST116' or '42P01' (table not found), it means we connected
        // to PostgREST successfully but the table doesn't exist.
        // If it's a network error, it's a real failure.

        if (error && error.message.includes("FetchError")) {
          setStatus("error");
          setError(error.message);
        } else {
          // Any response (even 404/401) from Supabase means the connection is working
          setStatus("success");
        }
      } catch (err: any) {
        setStatus("error");
        setError(err.message);
      }
    }

    testConnection();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Supabase Connection Test</h1>
      <p>
        <strong>URL:</strong> {projectUrl}
      </p>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor:
            status === "loading"
              ? "#eee"
              : status === "success"
                ? "#d4edda"
                : "#f8d7da",
          color:
            status === "loading"
              ? "#333"
              : status === "success"
                ? "#155724"
                : "#721c24",
          border: `1px solid ${status === "loading" ? "#ccc" : status === "success" ? "#c3e6cb" : "#f5c6cb"}`,
        }}
      >
        {status === "loading" && <p>Testing connection...</p>}
        {status === "success" && (
          <div>
            <p>
              ✅ <strong>Connection Successful!</strong>
            </p>
            <p>
              The Supabase client successfully communicated with your project.
            </p>
          </div>
        )}
        {status === "error" && (
          <div>
            <p>
              ❌ <strong>Connection Failed</strong>
            </p>
            <p>Error: {error}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <a href="/" style={{ color: "#007bff", textDecoration: "none" }}>
          &larr; Back to App
        </a>
      </div>
    </div>
  );
}
