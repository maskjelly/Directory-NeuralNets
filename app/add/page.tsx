"use client";
import { useState } from "react";
import {onSubmit } from "../actions/route";

export default function AddData() {
  const [Title, setTitle] = useState<string>("");
  const [Link, setLink] = useState<string>("");
  const [Description, setDescription] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatusMessage(null); // Clear previous messages
    const response = await onSubmit(Title, Description, Link);

    if (response.success) {
      setStatusMessage(response.message);
    } else {
      setStatusMessage("Error: " + response.message);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={Title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="input input-neutral"
      />
      <input
        type="text"
        value={Link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Link"
        className="input input-neutral"
      />
      <input
        type="text"
        value={Description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="input input-neutral"
      />
      <button onClick={handleSubmit} className="btn btn-accent">
        Submit
      </button>
      {statusMessage && <p className="text-sm mt-2">{statusMessage}</p>}
    </div>
  );
}
